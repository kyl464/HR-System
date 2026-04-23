package seed

import (
	"kkhris-clone/database"
	"log"
	"time"

	"golang.org/x/crypto/bcrypt"
)

func SeedPostgres(_ interface{}) {
	users, _ := database.GetAllUsersMongo()
	if len(users) > 0 {
		log.Println("Database already seeded, skipping...")
		return
	}

	log.Println("Seeding PostgreSQL...")

	adminPass, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	managerPass, _ := bcrypt.GenerateFromPassword([]byte("manager123"), bcrypt.DefaultCost)
	demoPass, _ := bcrypt.GenerateFromPassword([]byte("demo123"), bcrypt.DefaultCost)

	seedUsers := []database.UserMongo{
		{Email: "admin@demo.com", Password: string(adminPass), Name: "Admin Demo", Role: "admin", IsAdmin: true, ShowInDirectory: true},
		{Email: "manager@demo.com", Password: string(managerPass), Name: "Manager Demo", Role: "manager", IsAdmin: false, ShowInDirectory: true},
		{Email: "demo@demo.com", Password: string(demoPass), Name: "Demo User", Role: "staff", IsAdmin: false, ShowInDirectory: true},
	}
	for _, u := range seedUsers {
		database.CreateUserMongo(u)
	}
	log.Println("Seeded 3 users")

	announcements := []database.AnnouncementMongo{
		{Title: "Selamat Tahun Baru 2026!", Content: "Semoga tahun ini membawa kebahagiaan dan kesuksesan untuk kita semua.", IsActive: true, CreatedAt: time.Now().Format("2006-01-02")},
		{Title: "Update Kebijakan Cuti", Content: "Mulai bulan ini, pengajuan cuti harus dilakukan minimal 3 hari sebelumnya.", IsActive: true, CreatedAt: time.Now().Format("2006-01-02")},
	}
	for _, a := range announcements {
		database.CreateAnnouncementMongo(a)
	}
	log.Println("Seeded 2 announcements")

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

	log.Println("PostgreSQL seeding complete!")
}
