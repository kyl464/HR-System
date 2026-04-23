package database

import "context"

// --- Employees ---
func GetAllEmployeesMongo() ([]EmployeeMongo, error) {
	rows, err := pool.Query(context.Background(),
		`SELECT id,email,name,center,roles,photo_url,branch_id,sex,pob,dob,age,religion,phone,address1,nik,npwp,education_level,institution,major,graduation_year,bank_account,status_ptkp,jabatan FROM users WHERE show_in_directory=true`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var emps []EmployeeMongo
	for rows.Next() {
		var e EmployeeMongo
		var branchID string
		if err := rows.Scan(&e.ID, &e.Email, &e.Name, &e.Center, &e.Roles, &e.PhotoURL, &branchID, &e.Sex, &e.PoB, &e.DoB, &e.Age, &e.Religion, &e.Phone, &e.Address1, &e.NIK, &e.NPWP, &e.EducationLevel, &e.Institution, &e.Major, &e.GraduationYear, &e.BankAccount, &e.StatusPTKP, &e.Jabatan); err != nil {
			return nil, err
		}
		e.UserID = e.ID
		e.BranchID = branchID
		emps = append(emps, e)
	}
	return emps, nil
}

func CreateEmployeeMongo(emp EmployeeMongo) (*EmployeeMongo, error) {
	emp.ID = newUUID()
	_, err := pool.Exec(context.Background(),
		`INSERT INTO users (id,email,name,center,roles,photo_url,branch_id,sex,pob,dob,age,religion,phone,address1,nik,npwp,education_level,institution,major,graduation_year,bank_account,status_ptkp,jabatan,password,role,show_in_directory) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,'','staff',true)`,
		emp.ID, emp.Email, emp.Name, emp.Center, emp.Roles, emp.PhotoURL, "", emp.Sex, emp.PoB, emp.DoB, emp.Age, emp.Religion, emp.Phone, emp.Address1, emp.NIK, emp.NPWP, emp.EducationLevel, emp.Institution, emp.Major, emp.GraduationYear, emp.BankAccount, emp.StatusPTKP, emp.Jabatan)
	if err != nil {
		return nil, err
	}
	return &emp, nil
}

func DeleteEmployeeMongo(id string) error {
	_, err := pool.Exec(context.Background(), `DELETE FROM users WHERE id=$1`, id)
	return err
}

// --- Announcements ---
func GetAnnouncementsMongo() ([]AnnouncementMongo, error) {
	rows, err := pool.Query(context.Background(), `SELECT id,title,content,is_active,created_at FROM announcements WHERE is_active=true`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []AnnouncementMongo
	for rows.Next() {
		var a AnnouncementMongo
		if err := rows.Scan(&a.ID, &a.Title, &a.Content, &a.IsActive, &a.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, a)
	}
	return list, nil
}

func CreateAnnouncementMongo(ann AnnouncementMongo) (*AnnouncementMongo, error) {
	ann.ID = newUUID()
	_, err := pool.Exec(context.Background(),
		`INSERT INTO announcements (id,title,content,is_active,created_at) VALUES ($1,$2,$3,$4,$5)`,
		ann.ID, ann.Title, ann.Content, ann.IsActive, ann.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &ann, nil
}

func DeleteAnnouncementMongo(id string) error {
	_, err := pool.Exec(context.Background(), `DELETE FROM announcements WHERE id=$1`, id)
	return err
}

// --- Calendar Events ---
func GetCalendarEventsMongo() ([]CalendarEventMongo, error) {
	rows, err := pool.Query(context.Background(), `SELECT id,date,type,title,created_at FROM calendar_events`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []CalendarEventMongo
	for rows.Next() {
		var e CalendarEventMongo
		if err := rows.Scan(&e.ID, &e.Date, &e.Type, &e.Title, &e.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, e)
	}
	return list, nil
}

func CreateCalendarEventMongo(event CalendarEventMongo) (*CalendarEventMongo, error) {
	event.ID = newUUID()
	_, err := pool.Exec(context.Background(),
		`INSERT INTO calendar_events (id,date,type,title,created_at) VALUES ($1,$2,$3,$4,$5)`,
		event.ID, event.Date, event.Type, event.Title, event.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &event, nil
}

func DeleteCalendarEventMongo(id string) error {
	_, err := pool.Exec(context.Background(), `DELETE FROM calendar_events WHERE id=$1`, id)
	return err
}

// --- Branches ---
func GetBranchesMongo() ([]BranchMongo, error) {
	rows, err := pool.Query(context.Background(), `SELECT id,name,region FROM branches`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []BranchMongo
	for rows.Next() {
		var b BranchMongo
		if err := rows.Scan(&b.ID, &b.Name, &b.Region); err != nil {
			return nil, err
		}
		list = append(list, b)
	}
	return list, nil
}

func CreateBranchMongo(branch BranchMongo) (*BranchMongo, error) {
	branch.ID = newUUID()
	_, err := pool.Exec(context.Background(),
		`INSERT INTO branches (id,name,region) VALUES ($1,$2,$3)`, branch.ID, branch.Name, branch.Region)
	if err != nil {
		return nil, err
	}
	return &branch, nil
}

func DeleteBranchMongo(id string) error {
	_, err := pool.Exec(context.Background(), `DELETE FROM branches WHERE id=$1`, id)
	return err
}

func UpdateBranchMongo(id string, branch BranchMongo) error {
	_, err := pool.Exec(context.Background(), `UPDATE branches SET name=$2,region=$3 WHERE id=$1`, id, branch.Name, branch.Region)
	return err
}

// --- Schools ---
func GetSchoolsMongo() ([]SchoolMongo, error) {
	rows, err := pool.Query(context.Background(), `SELECT id,name,level,address FROM schools`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []SchoolMongo
	for rows.Next() {
		var s SchoolMongo
		if err := rows.Scan(&s.ID, &s.Name, &s.Level, &s.Address); err != nil {
			return nil, err
		}
		list = append(list, s)
	}
	return list, nil
}

func CreateSchoolMongo(school SchoolMongo) (*SchoolMongo, error) {
	school.ID = newUUID()
	_, err := pool.Exec(context.Background(),
		`INSERT INTO schools (id,name,level,address) VALUES ($1,$2,$3,$4)`, school.ID, school.Name, school.Level, school.Address)
	if err != nil {
		return nil, err
	}
	return &school, nil
}

func UpdateSchoolMongo(id string, school SchoolMongo) error {
	_, err := pool.Exec(context.Background(), `UPDATE schools SET name=$2,level=$3,address=$4 WHERE id=$1`, id, school.Name, school.Level, school.Address)
	return err
}

func DeleteSchoolMongo(id string) error {
	_, err := pool.Exec(context.Background(), `DELETE FROM schools WHERE id=$1`, id)
	return err
}

// --- Awards ---
func GetAllAwardsMongo() ([]AwardMongo, error) {
	rows, err := pool.Query(context.Background(), `SELECT id,user_id,user_name,title,description,date,created_at FROM awards`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []AwardMongo
	for rows.Next() {
		var a AwardMongo
		if err := rows.Scan(&a.ID, &a.UserID, &a.UserName, &a.Title, &a.Description, &a.Date, &a.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, a)
	}
	return list, nil
}

func CreateAwardMongo(award AwardMongo) (*AwardMongo, error) {
	award.ID = newUUID()
	_, err := pool.Exec(context.Background(),
		`INSERT INTO awards (id,user_id,user_name,title,description,date,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
		award.ID, award.UserID, award.UserName, award.Title, award.Description, award.Date, award.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &award, nil
}

func DeleteAwardMongo(id string) error {
	_, err := pool.Exec(context.Background(), `DELETE FROM awards WHERE id=$1`, id)
	return err
}

func DeleteAwardsByUser(userID string) error {
	_, err := pool.Exec(context.Background(), `DELETE FROM awards WHERE user_id=$1`, userID)
	return err
}
