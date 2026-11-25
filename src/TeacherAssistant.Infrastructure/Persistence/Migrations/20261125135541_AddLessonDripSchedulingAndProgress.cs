using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TeacherAssistant.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddLessonDripSchedulingAndProgress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AttachmentUrl",
                table: "Lessons",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "AvailableAt",
                table: "Lessons",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ModuleTitle",
                table: "Lessons",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "RequiresPreviousCompletion",
                table: "Lessons",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "LessonProgresses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    StudentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LessonId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IsCompleted = table.Column<bool>(type: "bit", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ViewCount = table.Column<int>(type: "int", nullable: false),
                    LastViewedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LessonProgresses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LessonProgresses_Lessons_LessonId",
                        column: x => x.LessonId,
                        principalTable: "Lessons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LessonProgresses_Users_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LessonProgresses_LessonId",
                table: "LessonProgresses",
                column: "LessonId");

            migrationBuilder.CreateIndex(
                name: "IX_LessonProgresses_StudentId",
                table: "LessonProgresses",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_LessonProgresses_TenantId",
                table: "LessonProgresses",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_LessonProgresses_TenantId_StudentId_LessonId",
                table: "LessonProgresses",
                columns: new[] { "TenantId", "StudentId", "LessonId" },
                unique: true,
                filter: "[TenantId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LessonProgresses");

            migrationBuilder.DropColumn(
                name: "AttachmentUrl",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "AvailableAt",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "ModuleTitle",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "RequiresPreviousCompletion",
                table: "Lessons");
        }
    }
}
