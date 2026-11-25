using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TeacherAssistant.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAssessmentTypeDurationAndPassingScore : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DurationMinutes",
                table: "Quizzes",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsPublished",
                table: "Quizzes",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "PassingScorePercent",
                table: "Quizzes",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Type",
                table: "Quizzes",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DurationMinutes",
                table: "Quizzes");

            migrationBuilder.DropColumn(
                name: "IsPublished",
                table: "Quizzes");

            migrationBuilder.DropColumn(
                name: "PassingScorePercent",
                table: "Quizzes");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "Quizzes");
        }
    }
}
