using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TeacherAssistant.Infrastructure.Persistence.Migrations
{
    /// <summary>
    /// Phase 3: renames Courses to Subjects (data-preserving), adds Groups and
    /// GroupMemberships, and renames the CourseId columns on dependent tables.
    /// This migration deliberately uses RenameTable/RenameColumn/RenameIndex:
    /// no business data is dropped.
    /// </summary>
    public partial class Phase3SubjectGroups : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Drop the foreign keys that point at Courses (recreated below with new names).
            migrationBuilder.DropForeignKey(
                name: "FK_Enrollments_Courses_CourseId",
                table: "Enrollments");

            migrationBuilder.DropForeignKey(
                name: "FK_Lessons_Courses_CourseId",
                table: "Lessons");

            migrationBuilder.DropForeignKey(
                name: "FK_Quizzes_Courses_CourseId",
                table: "Quizzes");

            migrationBuilder.DropForeignKey(
                name: "FK_Courses_Users_InstructorId",
                table: "Courses");

            // 2. Rename the table itself; all course rows are preserved.
            migrationBuilder.RenameTable(
                name: "Courses",
                newName: "Subjects");

            // 3. Rename the dependent columns and their indexes.
            migrationBuilder.RenameColumn(
                name: "CourseId",
                table: "Quizzes",
                newName: "SubjectId");

            migrationBuilder.RenameIndex(
                name: "IX_Quizzes_CourseId",
                table: "Quizzes",
                newName: "IX_Quizzes_SubjectId");

            migrationBuilder.RenameColumn(
                name: "CourseId",
                table: "Lessons",
                newName: "SubjectId");

            migrationBuilder.RenameIndex(
                name: "IX_Lessons_CourseId_SortOrder",
                table: "Lessons",
                newName: "IX_Lessons_SubjectId_SortOrder");

            migrationBuilder.RenameColumn(
                name: "CourseId",
                table: "Enrollments",
                newName: "SubjectId");

            migrationBuilder.RenameIndex(
                name: "IX_Enrollments_CourseId",
                table: "Enrollments",
                newName: "IX_Enrollments_SubjectId");

            migrationBuilder.RenameIndex(
                name: "IX_Enrollments_StudentId_CourseId",
                table: "Enrollments",
                newName: "IX_Enrollments_StudentId_SubjectId");

            // 4. Rename the indexes that live on the renamed table.
            migrationBuilder.RenameIndex(
                name: "IX_Courses_InstructorId",
                table: "Subjects",
                newName: "IX_Subjects_InstructorId");

            migrationBuilder.RenameIndex(
                name: "IX_Courses_TenantId",
                table: "Subjects",
                newName: "IX_Subjects_TenantId");

            // Keep the primary key name in sync with the new table name.
            migrationBuilder.Sql("EXEC sp_rename N'PK_Courses', N'PK_Subjects';");

            // 5. Re-add the foreign keys with their new names.
            migrationBuilder.AddForeignKey(
                name: "FK_Subjects_Users_InstructorId",
                table: "Subjects",
                column: "InstructorId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Enrollments_Subjects_SubjectId",
                table: "Enrollments",
                column: "SubjectId",
                principalTable: "Subjects",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Lessons_Subjects_SubjectId",
                table: "Lessons",
                column: "SubjectId",
                principalTable: "Subjects",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Quizzes_Subjects_SubjectId",
                table: "Quizzes",
                column: "SubjectId",
                principalTable: "Subjects",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // 6. Groups and group memberships.
            migrationBuilder.CreateTable(
                name: "Groups",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    SubjectId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    ScheduleText = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    JoinCode = table.Column<string>(type: "nvarchar(8)", maxLength: 8, nullable: false),
                    IsCodeActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    IsOpen = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Groups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Groups_Subjects_SubjectId",
                        column: x => x.SubjectId,
                        principalTable: "Subjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GroupMemberships",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    GroupId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SubjectId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StudentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupMemberships", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupMemberships_Groups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "Groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GroupMemberships_Users_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GroupMemberships_GroupId",
                table: "GroupMemberships",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupMemberships_StudentId_SubjectId",
                table: "GroupMemberships",
                columns: new[] { "StudentId", "SubjectId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GroupMemberships_SubjectId",
                table: "GroupMemberships",
                column: "SubjectId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupMemberships_TenantId",
                table: "GroupMemberships",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Groups_SubjectId",
                table: "Groups",
                column: "SubjectId");

            migrationBuilder.CreateIndex(
                name: "IX_Groups_TenantId",
                table: "Groups",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Groups_TenantId_JoinCode",
                table: "Groups",
                columns: new[] { "TenantId", "JoinCode" },
                unique: true,
                filter: "[TenantId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GroupMemberships");

            migrationBuilder.DropTable(
                name: "Groups");

            migrationBuilder.DropForeignKey(
                name: "FK_Enrollments_Subjects_SubjectId",
                table: "Enrollments");

            migrationBuilder.DropForeignKey(
                name: "FK_Lessons_Subjects_SubjectId",
                table: "Lessons");

            migrationBuilder.DropForeignKey(
                name: "FK_Quizzes_Subjects_SubjectId",
                table: "Quizzes");

            migrationBuilder.DropForeignKey(
                name: "FK_Subjects_Users_InstructorId",
                table: "Subjects");

            migrationBuilder.RenameIndex(
                name: "IX_Enrollments_StudentId_SubjectId",
                table: "Enrollments",
                newName: "IX_Enrollments_StudentId_CourseId");

            migrationBuilder.RenameIndex(
                name: "IX_Enrollments_SubjectId",
                table: "Enrollments",
                newName: "IX_Enrollments_CourseId");

            migrationBuilder.RenameColumn(
                name: "SubjectId",
                table: "Enrollments",
                newName: "CourseId");

            migrationBuilder.RenameIndex(
                name: "IX_Lessons_SubjectId_SortOrder",
                table: "Lessons",
                newName: "IX_Lessons_CourseId_SortOrder");

            migrationBuilder.RenameColumn(
                name: "SubjectId",
                table: "Lessons",
                newName: "CourseId");

            migrationBuilder.RenameIndex(
                name: "IX_Quizzes_SubjectId",
                table: "Quizzes",
                newName: "IX_Quizzes_CourseId");

            migrationBuilder.RenameColumn(
                name: "SubjectId",
                table: "Quizzes",
                newName: "CourseId");

            migrationBuilder.RenameIndex(
                name: "IX_Subjects_InstructorId",
                table: "Subjects",
                newName: "IX_Courses_InstructorId");

            migrationBuilder.RenameIndex(
                name: "IX_Subjects_TenantId",
                table: "Subjects",
                newName: "IX_Courses_TenantId");

            migrationBuilder.Sql("EXEC sp_rename N'PK_Subjects', N'PK_Courses';");

            migrationBuilder.RenameTable(
                name: "Subjects",
                newName: "Courses");

            migrationBuilder.AddForeignKey(
                name: "FK_Courses_Users_InstructorId",
                table: "Courses",
                column: "InstructorId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Enrollments_Courses_CourseId",
                table: "Enrollments",
                column: "CourseId",
                principalTable: "Courses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Lessons_Courses_CourseId",
                table: "Lessons",
                column: "CourseId",
                principalTable: "Courses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Quizzes_Courses_CourseId",
                table: "Quizzes",
                column: "CourseId",
                principalTable: "Courses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
