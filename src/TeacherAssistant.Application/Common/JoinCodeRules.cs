using System.Security.Cryptography;

namespace TeacherAssistant.Application.Common;

/// <summary>
/// Join codes are 8 characters from a deliberately unambiguous alphabet
/// (no 0/O, no 1/I) so teachers can read them aloud safely.
/// </summary>
public static class JoinCodeRules
{
    public const int Length = 8;
    public const string Alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    public static string Normalize(string? code) => (code ?? string.Empty).Trim().ToUpperInvariant();

    public static bool IsValidFormat(string? code)
    {
        var normalized = Normalize(code);
        return normalized.Length == Length && normalized.All(c => Alphabet.Contains(c));
    }

    public static string Generate()
    {
        var chars = new char[Length];
        for (var i = 0; i < chars.Length; i++)
        {
            chars[i] = Alphabet[RandomNumberGenerator.GetInt32(Alphabet.Length)];
        }

        return new string(chars);
    }
}
