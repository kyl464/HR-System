package seed

import (
	"log"
	"time"

	"kkhris-clone/database"

	"golang.org/x/crypto/bcrypt"
)

func SeedData() {
	// Check if data already exists
	if len(database.DB.Users) > 0 {
		log.Println("Data already seeded, skipping...")
		return
	}

	log.Println("Seeding database...")

	// Create admin user
	adminPassword, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	admin := database.User{
		ID:       1,
		Email:    "admin@kodekiddo.com",
		Password: string(adminPassword),
		Name:     "Administrator",
		Role:     "admin",
		IsAdmin:  true,
	}
	database.DB.Users = append(database.DB.Users, admin)

	// Create staff user
	staffPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	staff := database.User{
		ID:       2,
		Email:    "luvky@kodekiddo.com",
		Password: string(staffPassword),
		Name:     "Luvky Pratama Johanes",
		Role:     "staff",
		IsAdmin:  false,
	}
	database.DB.Users = append(database.DB.Users, staff)

	// Create employee profile for staff
	employee := database.Employee{
		ID:             1,
		UserID:         staff.ID,
		Name:           "Luvky Pratama Johanes",
		Center:         "HQ",
		Roles:          "Staff",
		PhotoURL:       "https://ui-avatars.com/api/?name=Luvky+Pratama&background=6366f1&color=fff&size=200",
		Sex:            "Laki-Laki",
		PoB:            "Sukabumi",
		DoB:            "04/08/2004",
		Age:            21,
		Religion:       "Kristen Protestan",
		Phone:          "6289560760000",
		Address1:       "-",
		Address2:       "-",
		NIK:            "3272020406040021",
		NPWP:           "-",
		EducationLevel: "Tingkat SMU/Setara",
		Institution:    "-",
		Major:          "-",
		GraduationYear: 0,
		BankAccount:    "BCA A/N LUVKY PRATAMA JOHANES 3770519399",
		StatusPTKP:     "TK0",
	}
	database.DB.Employees = append(database.DB.Employees, employee)

	// Create more employees for directory
	employees := []database.Employee{
		{ID: 2, Name: "Marvin Apriyadi", Center: "HQ", Roles: "Partner Channel Lead, New Center Prep", PhotoURL: "https://ui-avatars.com/api/?name=Marvin+Apriyadi&background=10b981&color=fff&size=200"},
		{ID: 3, Name: "Asri Prameshwari", Center: "HQ", Roles: "Branch Manager Support Lead", PhotoURL: "https://ui-avatars.com/api/?name=Asri+Prameshwari&background=f59e0b&color=fff&size=200"},
		{ID: 4, Name: "Jaguari Brawijaya", Center: "HQ", Roles: "Content Research Lead", PhotoURL: "https://ui-avatars.com/api/?name=Jaguari+Brawijaya&background=3b82f6&color=fff&size=200"},
		{ID: 5, Name: "Puthut Giri Winoto", Center: "HQ", Roles: "Teacher Support Lead", PhotoURL: "https://ui-avatars.com/api/?name=Puthut+Giri&background=8b5cf6&color=fff&size=200"},
		{ID: 6, Name: "Ni Ketut Oktaviana", Center: "HQ", Roles: "Accounting Lead", PhotoURL: "https://ui-avatars.com/api/?name=Ni+Ketut&background=ec4899&color=fff&size=200"},
		{ID: 7, Name: "Sarah Amelia", Center: "Branch Jakarta", Roles: "Branch Manager", PhotoURL: "https://ui-avatars.com/api/?name=Sarah+Amelia&background=14b8a6&color=fff&size=200"},
		{ID: 8, Name: "Budi Santoso", Center: "Branch Bandung", Roles: "Senior Instructor", PhotoURL: "https://ui-avatars.com/api/?name=Budi+Santoso&background=f97316&color=fff&size=200"},
		{ID: 9, Name: "Diana Putri", Center: "HQ", Roles: "HR Manager", PhotoURL: "https://ui-avatars.com/api/?name=Diana+Putri&background=06b6d4&color=fff&size=200"},
	}
	database.DB.Employees = append(database.DB.Employees, employees...)

	// Create announcements
	database.DB.Announcements = []database.Announcement{
		{ID: 1, Title: "Welcome to KodeKiddo HR System!", Content: "Selamat datang di KKHRIS. Gunakan aplikasi ini untuk absensi dan pengelolaan HR.\n\n- KKHRIS Team", IsActive: true, CreatedAt: time.Now().Format(time.RFC3339)},
		{ID: 2, Title: "Reminder: Isi Absensi Harian", Content: "Jangan lupa untuk mengisi absensi setiap hari kerja.", IsActive: true, CreatedAt: time.Now().Format(time.RFC3339)},
	}

	// Create awards
	database.DB.Awards = []database.Award{
		{ID: 1, Quarter: "Q3", Year: 2025, EmployeeName: "Muhammad Daffa Ibrahim", AwardName: "The High Flyer"},
		{ID: 2, Quarter: "Q3", Year: 2025, EmployeeName: "Muhammad Ikhwan Jaizy", AwardName: "The High Flyers"},
		{ID: 3, Quarter: "Q3", Year: 2025, EmployeeName: "Jaguari Brawijaya", AwardName: "Go That Extra Mile"},
		{ID: 4, Quarter: "Q3", Year: 2025, EmployeeName: "Jazlyn Jan Kayla Latif", AwardName: "The High Flyers"},
		{ID: 5, Quarter: "Q3", Year: 2025, EmployeeName: "Fairuz Amanda Putri", AwardName: "The High Flyers"},
		{ID: 6, Quarter: "Q3", Year: 2025, EmployeeName: "Sherlyana Shevatra", AwardName: "The Growth Driver"},
		{ID: 7, Quarter: "Q3", Year: 2025, EmployeeName: "Ni Made Surianti", AwardName: "The Growth Driver"},
	}

	// Create sample attendance with new format
	database.DB.Attendance = []database.Attendance{
		{ID: 1, UserID: 2, Date: "2026-01-02", ActivityType: "Daily Activity", ActivityCategories: []string{"Regular Class"}, ActivityDetails: "Mengajar kelas coding", StartingTime: "09:00", EndingTime: "12:00", ActivityNotes: "Lancar", Session: "Morning", Status: "present", CreatedAt: time.Now().Format(time.RFC3339)},
		{ID: 2, UserID: 2, Date: "2026-01-03", ActivityType: "Daily Activity", ActivityCategories: []string{"Regular Class", "School Class"}, ActivityDetails: "Mengajar di sekolah", StartingTime: "08:00", EndingTime: "16:00", ActivityNotes: "Online via Zoom", Session: "Full Day", Status: "present", CreatedAt: time.Now().Format(time.RFC3339)},
		{ID: 3, UserID: 2, Date: "2026-01-06", ActivityType: "Event Activity", ActivityCategories: []string{"Private Class"}, ActivityDetails: "Private class customer", StartingTime: "14:00", EndingTime: "17:00", ActivityNotes: "Mobil pribadi", Session: "Afternoon", Status: "present", CreatedAt: time.Now().Format(time.RFC3339)},
	}

	// Create objectives
	database.DB.Objectives = []database.Objective{
		{ID: 1, Title: "Complete Training Module", Description: "Selesaikan semua modul training untuk karyawan baru", IsActive: true},
		{ID: 2, Title: "Project Submission", Description: "Submit project untuk review", IsActive: true},
	}

	// Save to file
	database.SaveDB()
	log.Println("Database seeded successfully!")
}
