using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MimeKit;
using MailKit.Net.Smtp;
using MailKit.Security;
using System;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IConfiguration _config;

    public AuthController(UserManager<ApplicationUser> userManager, IConfiguration config)
    {
        _userManager = userManager;
        _config = config;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        var user = new ApplicationUser
        {
            UserName = dto.Email,
            Email = dto.Email,
            DisplayName = dto.DisplayName
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded) return BadRequest(result.Errors);

        // Add claims or profile data if needed
        return Ok(new { message = "User registered successfully" });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null || !await _userManager.CheckPasswordAsync(user, dto.Password))
            return Unauthorized("Invalid credentials");

        var token = GenerateJwtToken(user);
        return Ok(new { token, user = new { user.Id, user.Email, user.DisplayName } });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email))
            return BadRequest(new { message = "Email is required" });

        var user = await _userManager.FindByEmailAsync(dto.Email);

        if (user == null)
        {
            return BadRequest(new { message = "Invalid email. Please register first." });
        }

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var resetLink = $"http://localhost:5173/reset-password?email={Uri.EscapeDataString(user.Email!)}&token={Uri.EscapeDataString(token)}";

        await SendPasswordResetEmail(user.Email!, resetLink, user.DisplayName);

        return Ok(new { message = "Password reset link has been sent to your email." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) ||
            string.IsNullOrWhiteSpace(dto.Token) ||
            string.IsNullOrWhiteSpace(dto.NewPassword))
        {
            return BadRequest(new { message = "All fields are required" });
        }

        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null)
        {
            return BadRequest(new { message = "Invalid request" });
        }

        var result = await _userManager.ResetPasswordAsync(user, dto.Token, dto.NewPassword);

        if (result.Succeeded)
        {
            return Ok(new { message = "Password has been reset successfully." });
        }

        var error = result.Errors.FirstOrDefault()?.Description ?? "Failed to reset password.";
        return BadRequest(new { message = error });
    }

    private async Task SendPasswordResetEmail(string email, string resetLink, string? displayName = null)
    {
        try
        {
            var emailSettings = _config.GetSection("EmailSettings").Get<EmailSettings>();

            if (emailSettings == null || string.IsNullOrEmpty(emailSettings.SmtpUsername))
            {
                Console.WriteLine("⚠️ Email settings not configured. Printing reset link instead:");
                Console.WriteLine($"To: {email}");
                Console.WriteLine($"Reset Link: {resetLink}");
                return;
            }

            var emailMessage = new MimeMessage();
            emailMessage.From.Add(new MailboxAddress(emailSettings.FromName, emailSettings.FromEmail));
            emailMessage.To.Add(new MailboxAddress(displayName ?? "User", email));
            emailMessage.Subject = "Reset Your Password - Aurora";

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = $@" 
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                <h2>Password Reset Request</h2>
                <p>Hello {displayName ?? "User"},</p>
                <p>You have requested to reset your password. Please click the button below:</p>
                <p style='margin: 30px 0;'>
                    <a href='{resetLink}' 
                       style='background-color: #0f172a; color: white; padding: 14px 28px; 
                              text-decoration: none; border-radius: 8px; font-weight: bold;'>
                        Reset My Password
                    </a>
                </p>
                <p><strong>This link will expire in 24 hours.</strong></p>
                <p>If you did not request this, please ignore this email.</p>
                <hr>
                <p style='font-size: 12px; color: #666;'>Aurora Login Application</p>
            </div>"
            };
            emailMessage.Body = bodyBuilder.ToMessageBody();

            using var smtp = new SmtpClient();

            // === THIS IS THE MOST IMPORTANT CHANGE ===
            await smtp.ConnectAsync(
                emailSettings.SmtpServer,
                emailSettings.SmtpPort,
                SecureSocketOptions.StartTls);   // ← Use this instead of boolean

            await smtp.AuthenticateAsync(emailSettings.SmtpUsername, emailSettings.SmtpPassword);
            await smtp.SendAsync(emailMessage);
            await smtp.DisconnectAsync(true);

            Console.WriteLine($"✅ Password reset email sent successfully to: {email}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Failed to send email: {ex.Message}");
            Console.WriteLine($"Reset Link (for testing): {resetLink}");

            // Print full error for debugging
            Console.WriteLine($"Full Error: {ex}");
        }
    }

    private string GenerateJwtToken(ApplicationUser user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email!),
            new Claim("DisplayName", user.DisplayName ?? "")
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.Now.AddDays(7),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public class RegisterDto { public string Email { get; set; } = string.Empty; public string Password { get; set; } = string.Empty; public string? DisplayName { get; set; } }
public class LoginDto { public string Email { get; set; } = string.Empty; public string Password { get; set; } = string.Empty; }
public class ForgotPasswordDto
{
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordDto
{
    public string Email { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class EmailSettings
{
    public string FromEmail { get; set; } = string.Empty;
    public string FromName { get; set; } = string.Empty;
    public string SmtpServer { get; set; } = string.Empty;
    public int SmtpPort { get; set; }
    public string SmtpUsername { get; set; } = string.Empty;
    public string SmtpPassword { get; set; } = string.Empty;
    public bool EnableSsl { get; set; } = true;
}