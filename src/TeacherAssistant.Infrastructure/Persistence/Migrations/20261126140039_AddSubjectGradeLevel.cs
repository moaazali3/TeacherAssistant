using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TeacherAssistant.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSubjectGradeLevel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GradeLevel",
                table: "Subjects",
                type: "nvarchar(60)",
                maxLength: 60,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GradeLevel",
                table: "Subjects");
        }
    }
}
