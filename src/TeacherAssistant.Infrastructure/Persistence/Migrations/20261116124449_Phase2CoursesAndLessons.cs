using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TeacherAssistant.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Phase2CoursesAndLessons : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Lessons_CourseId",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "AttachmentUrl",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "VideoUrl",
                table: "Lessons");

            migrationBuilder.AddColumn<string>(
                name: "ContentUrl",
                table: "Lessons",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Lessons",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsPublished",
                table: "Lessons",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "SortOrder",
                table: "Lessons",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<string>(
                name: "ThumbnailUrl",
                table: "Courses",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsPublished",
                table: "Courses",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_Lessons_CourseId_SortOrder",
                table: "Lessons",
                columns: new[] { "CourseId", "SortOrder" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Lessons_CourseId_SortOrder",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "ContentUrl",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "IsPublished",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "SortOrder",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "IsPublished",
                table: "Courses");

            migrationBuilder.AddColumn<string>(
                name: "AttachmentUrl",
                table: "Lessons",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VideoUrl",
                table: "Lessons",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ThumbnailUrl",
                table: "Courses",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Lessons_CourseId",
                table: "Lessons",
                column: "CourseId");
        }
    }
}
