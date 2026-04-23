package database

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

var pool *pgxpool.Pool

// Models
type UserMongo struct {
	ID              string      `json:"id"`
	Email           string      `json:"email"`
	Password        string      `json:"password,omitempty"`
	Name            string      `json:"name"`
	Role            string      `json:"role"`
	IsAdmin         bool        `json:"is_admin"`
	Center          string      `json:"center"`
	Roles           string      `json:"roles"`
	PhotoURL        string      `json:"photo_url"`
	BranchID        interface{} `json:"branch_id"`
	Sex             string      `json:"sex"`
	PoB             string      `json:"pob"`
	DoB             string      `json:"dob"`
	Age             int         `json:"age"`
	Religion        string      `json:"religion"`
	Phone           string      `json:"phone"`
	Address1        string      `json:"address1"`
	Address2        string      `json:"address2"`
	NIK             string      `json:"nik"`
	NPWP            string      `json:"npwp"`
	EducationLevel  string      `json:"education_level"`
	Institution     string      `json:"institution"`
	Major           string      `json:"major"`
	GraduationYear  int         `json:"graduation_year"`
	BankAccount     string      `json:"bank_account"`
	StatusPTKP      string      `json:"status_ptkp"`
	Jabatan         string      `json:"jabatan"`
	ShowInDirectory bool        `json:"show_in_directory"`
}

type EmployeeMongo struct {
	ID             string      `json:"id"`
	UserID         string      `json:"user_id"`
	Name           string      `json:"name"`
	Center         string      `json:"center"`
	Roles          string      `json:"roles"`
	PhotoURL       string      `json:"photo_url"`
	BranchID       interface{} `json:"branch_id"`
	Sex            string      `json:"sex"`
	PoB            string      `json:"pob"`
	DoB            string      `json:"dob"`
	Age            int         `json:"age"`
	Religion       string      `json:"religion"`
	Phone          string      `json:"phone"`
	Address1       string      `json:"address1"`
	Address2       string      `json:"address2"`
	NIK            string      `json:"nik"`
	NPWP           string      `json:"npwp"`
	EducationLevel string      `json:"education_level"`
	Institution    string      `json:"institution"`
	Major          string      `json:"major"`
	GraduationYear int         `json:"graduation_year"`
	BankAccount    string      `json:"bank_account"`
	StatusPTKP     string      `json:"status_ptkp"`
	Jabatan        string      `json:"jabatan"`
	Email          string      `json:"email"`
}

type AttendanceMongo struct {
	ID                 string   `json:"id"`
	UserID             string   `json:"user_id"`
	Date               string   `json:"date"`
	ActivityType       string   `json:"activity_type"`
	ActivityCategories []string `json:"activity_categories"`
	ActivityDetails    string   `json:"activity_details"`
	StartingTime       string   `json:"starting_time"`
	EndingTime         string   `json:"ending_time"`
	ActivityDocs       string   `json:"activity_docs"`
	ActivityNotes      string   `json:"activity_notes"`
	Session            string   `json:"session"`
	Status             string   `json:"status"`
	CreatedAt          string   `json:"created_at"`
}

type AnnouncementMongo struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	Content   string `json:"content"`
	IsActive  bool   `json:"is_active"`
	CreatedAt string `json:"created_at"`
}

type CalendarEventMongo struct {
	ID        string `json:"id"`
	Date      string `json:"date"`
	Type      string `json:"type"`
	Title     string `json:"title"`
	CreatedAt string `json:"created_at"`
}

type WorkPermitMongo struct {
	ID             string `json:"id"`
	UserID         string `json:"user_id"`
	Date           string `json:"date"`
	Session        string `json:"session"`
	LeaveType      string `json:"leave_type"`
	Reason         string `json:"reason"`
	SupportingFile string `json:"supporting_file"`
	Status         string `json:"status"`
}

type LeaveQuotaMongo struct {
	ID        string `json:"id"`
	UserID    string `json:"user_id"`
	Year      int    `json:"year"`
	Total     int    `json:"total"`
	Used      int    `json:"used"`
	Remaining int    `json:"remaining"`
}

type PendingRequestMongo struct {
	ID             string `json:"id"`
	Type           string `json:"type"`
	UserID         string `json:"user_id"`
	UserName       string `json:"user_name"`
	Date           string `json:"date"`
	Reason         string `json:"reason"`
	Details        string `json:"details"`
	Status         string `json:"status"`
	RejectReason   string `json:"reject_reason"`
	CreatedAt      string `json:"created_at"`
	RefID          string `json:"ref_id"`
	SupportingFile string `json:"supporting_file"`
}

type BranchMongo struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Region string `json:"region"`
}

type SchoolMongo struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Level   string `json:"level"`
	Address string `json:"address"`
}

type AwardMongo struct {
	ID          string `json:"id"`
	UserID      string `json:"user_id"`
	UserName    string `json:"user_name"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Date        string `json:"date"`
	CreatedAt   string `json:"created_at"`
}

func newUUID() string {
	return uuid.New().String()
}

func ConnectPostgres() error {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		return fmt.Errorf("DATABASE_URL environment variable is required")
	}

	var err error
	pool, err = pgxpool.New(context.Background(), dsn)
	if err != nil {
		return fmt.Errorf("unable to connect to database: %w", err)
	}

	if err = pool.Ping(context.Background()); err != nil {
		return fmt.Errorf("unable to ping database: %w", err)
	}

	log.Println("Connected to PostgreSQL (Neon)")

	if err = runMigrations(); err != nil {
		return fmt.Errorf("migration error: %w", err)
	}

	return nil
}

func runMigrations() error {
	ctx := context.Background()
	queries := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			email TEXT UNIQUE NOT NULL,
			password TEXT NOT NULL DEFAULT '',
			name TEXT NOT NULL DEFAULT '',
			role TEXT NOT NULL DEFAULT 'staff',
			is_admin BOOLEAN NOT NULL DEFAULT false,
			center TEXT NOT NULL DEFAULT '',
			roles TEXT NOT NULL DEFAULT '',
			photo_url TEXT NOT NULL DEFAULT '',
			branch_id TEXT NOT NULL DEFAULT '',
			sex TEXT NOT NULL DEFAULT '',
			pob TEXT NOT NULL DEFAULT '',
			dob TEXT NOT NULL DEFAULT '',
			age INTEGER NOT NULL DEFAULT 0,
			religion TEXT NOT NULL DEFAULT '',
			phone TEXT NOT NULL DEFAULT '',
			address1 TEXT NOT NULL DEFAULT '',
			address2 TEXT NOT NULL DEFAULT '',
			nik TEXT NOT NULL DEFAULT '',
			npwp TEXT NOT NULL DEFAULT '',
			education_level TEXT NOT NULL DEFAULT '',
			institution TEXT NOT NULL DEFAULT '',
			major TEXT NOT NULL DEFAULT '',
			graduation_year INTEGER NOT NULL DEFAULT 0,
			bank_account TEXT NOT NULL DEFAULT '',
			status_ptkp TEXT NOT NULL DEFAULT '',
			jabatan TEXT NOT NULL DEFAULT '',
			show_in_directory BOOLEAN NOT NULL DEFAULT true
		)`,
		`CREATE TABLE IF NOT EXISTS attendance (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			date TEXT NOT NULL DEFAULT '',
			activity_type TEXT NOT NULL DEFAULT '',
			activity_categories TEXT[] NOT NULL DEFAULT '{}',
			activity_details TEXT NOT NULL DEFAULT '',
			starting_time TEXT NOT NULL DEFAULT '',
			ending_time TEXT NOT NULL DEFAULT '',
			activity_docs TEXT NOT NULL DEFAULT '',
			activity_notes TEXT NOT NULL DEFAULT '',
			session TEXT NOT NULL DEFAULT '',
			status TEXT NOT NULL DEFAULT '',
			created_at TEXT NOT NULL DEFAULT ''
		)`,
		`CREATE TABLE IF NOT EXISTS announcements (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL DEFAULT '',
			content TEXT NOT NULL DEFAULT '',
			is_active BOOLEAN NOT NULL DEFAULT true,
			created_at TEXT NOT NULL DEFAULT ''
		)`,
		`CREATE TABLE IF NOT EXISTS calendar_events (
			id TEXT PRIMARY KEY,
			date TEXT NOT NULL DEFAULT '',
			type TEXT NOT NULL DEFAULT '',
			title TEXT NOT NULL DEFAULT '',
			created_at TEXT NOT NULL DEFAULT ''
		)`,
		`CREATE TABLE IF NOT EXISTS work_permits (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			date TEXT NOT NULL DEFAULT '',
			session TEXT NOT NULL DEFAULT '',
			leave_type TEXT NOT NULL DEFAULT '',
			reason TEXT NOT NULL DEFAULT '',
			supporting_file TEXT NOT NULL DEFAULT '',
			status TEXT NOT NULL DEFAULT 'pending'
		)`,
		`CREATE TABLE IF NOT EXISTS leave_quotas (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			year INTEGER NOT NULL DEFAULT 0,
			total INTEGER NOT NULL DEFAULT 12,
			used INTEGER NOT NULL DEFAULT 0,
			remaining INTEGER NOT NULL DEFAULT 12,
			UNIQUE(user_id, year)
		)`,
		`CREATE TABLE IF NOT EXISTS pending_requests (
			id TEXT PRIMARY KEY,
			type TEXT NOT NULL DEFAULT '',
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			user_name TEXT NOT NULL DEFAULT '',
			date TEXT NOT NULL DEFAULT '',
			reason TEXT NOT NULL DEFAULT '',
			details TEXT NOT NULL DEFAULT '',
			status TEXT NOT NULL DEFAULT 'pending',
			reject_reason TEXT NOT NULL DEFAULT '',
			created_at TEXT NOT NULL DEFAULT '',
			ref_id TEXT NOT NULL DEFAULT '',
			supporting_file TEXT NOT NULL DEFAULT ''
		)`,
		`CREATE TABLE IF NOT EXISTS branches (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL DEFAULT '',
			region TEXT NOT NULL DEFAULT ''
		)`,
		`CREATE TABLE IF NOT EXISTS schools (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL DEFAULT '',
			level TEXT NOT NULL DEFAULT '',
			address TEXT NOT NULL DEFAULT ''
		)`,
		`CREATE TABLE IF NOT EXISTS awards (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL DEFAULT '',
			user_name TEXT NOT NULL DEFAULT '',
			title TEXT NOT NULL DEFAULT '',
			description TEXT NOT NULL DEFAULT '',
			date TEXT NOT NULL DEFAULT '',
			created_at TEXT NOT NULL DEFAULT ''
		)`,
	}

	for _, q := range queries {
		if _, err := pool.Exec(ctx, q); err != nil {
			return fmt.Errorf("migration failed: %w\nQuery: %s", err, q)
		}
	}

	log.Println("Database migrations completed")
	return nil
}
