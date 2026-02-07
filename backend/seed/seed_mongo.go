package seed

import (
	"context"
	"kkhris-clone/database"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"golang.org/x/crypto/bcrypt"
)

func SeedMongoDB() {
	ctx := context.Background()

	// Check if users already exist
	count, err := database.UsersCollection().CountDocuments(ctx, bson.M{})
	if err != nil {
		log.Println("Error checking seed:", err)
		return
	}

	if count > 0 {
		log.Println("Database already seeded, skipping...")
		return
	}

	log.Println("Seeding MongoDB...")

	// Hash passwords
	adminPass, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	managerPass, _ := bcrypt.GenerateFromPassword([]byte("manager123"), bcrypt.DefaultCost)
	demoPass, _ := bcrypt.GenerateFromPassword([]byte("demo123"), bcrypt.DefaultCost)

	// Seed users
	users := []database.UserMongo{
		{Email: "admin@demo.com", Password: string(adminPass), Name: "Admin Demo", Role: "admin", IsAdmin: true, ShowInDirectory: true},
		{Email: "manager@demo.com", Password: string(managerPass), Name: "Manager Demo", Role: "manager", IsAdmin: false, ShowInDirectory: true},
		{Email: "demo@demo.com", Password: string(demoPass), Name: "Demo User", Role: "staff", IsAdmin: false, ShowInDirectory: true},
	}

	for _, u := range users {
		database.CreateUserMongo(u)
	}
	log.Println("Seeded 3 users")

	// Seed employees
	employees := []database.EmployeeMongo{
		{Name: "John Doe", Center: "Bekasi", Roles: "Teacher", PhotoURL: "", Sex: "Male", Phone: "08123456789"},
		{Name: "Jane Smith", Center: "Sukabumi", Roles: "Admin", PhotoURL: "", Sex: "Female", Phone: "08987654321"},
		{Name: "Bob Wilson", Center: "Bandung", Roles: "Teacher", PhotoURL: "", Sex: "Male", Phone: "08111222333"},
	}

	for _, e := range employees {
		database.CreateEmployeeMongo(e)
	}
	log.Println("Seeded 3 employees")

	// Seed announcements
	announcements := []database.AnnouncementMongo{
		{Title: "Selamat Tahun Baru 2026!", Content: "Semoga tahun ini membawa kebahagiaan dan kesuksesan untuk kita semua.", IsActive: true, CreatedAt: time.Now().Format("2006-01-02")},
		{Title: "Update Kebijakan Cuti", Content: "Mulai bulan ini, pengajuan cuti harus dilakukan minimal 3 hari sebelumnya.", IsActive: true, CreatedAt: time.Now().Format("2006-01-02")},
	}

	for _, a := range announcements {
		database.CreateAnnouncementMongo(a)
	}
	log.Println("Seeded 2 announcements")

	// Seed branches
	branches := []database.BranchMongo{
		{Name: "Bekasi", Region: "Jabodetabek"},
		{Name: "Permata Buana", Region: "Jabodetabek"},
		{Name: "Gading Serpong", Region: "Jabodetabek"},
		{Name: "Sukabumi", Region: "Jawa Barat"},
		{Name: "Bandung Antapani", Region: "Jawa Barat"},
		{Name: "Semarang", Region: "Jawa Tengah"},
		{Name: "Surabaya", Region: "Jawa Timur"},
		{Name: "Malang", Region: "Jawa Timur"},
		{Name: "Bali", Region: "Bali"},
		{Name: "Medan", Region: "Sumatera"},
		{Name: "Palembang", Region: "Sumatera"},
		{Name: "Online", Region: "Online"},
	}

	for _, b := range branches {
		database.CreateBranchMongo(b)
	}
	log.Println("Seeded 12 branches")

	log.Println("MongoDB seeding complete!")
}
