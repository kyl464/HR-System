package database

import (
	"context"
	"fmt"
)

func GetUserByEmail(email string) (*UserMongo, error) {
	var u UserMongo
	var branchID string
	err := pool.QueryRow(context.Background(),
		`SELECT id,email,password,name,role,is_admin,center,roles,photo_url,branch_id,sex,pob,dob,age,religion,phone,address1,address2,nik,npwp,education_level,institution,major,graduation_year,bank_account,status_ptkp,jabatan,show_in_directory FROM users WHERE email=$1`, email).Scan(
		&u.ID, &u.Email, &u.Password, &u.Name, &u.Role, &u.IsAdmin,
		&u.Center, &u.Roles, &u.PhotoURL, &branchID, &u.Sex, &u.PoB, &u.DoB, &u.Age,
		&u.Religion, &u.Phone, &u.Address1, &u.Address2, &u.NIK, &u.NPWP,
		&u.EducationLevel, &u.Institution, &u.Major, &u.GraduationYear,
		&u.BankAccount, &u.StatusPTKP, &u.Jabatan, &u.ShowInDirectory)
	if err != nil {
		return nil, err
	}
	u.BranchID = branchID
	return &u, nil
}

func GetUserByIDMongo(id string) (*UserMongo, error) {
	var u UserMongo
	var branchID string
	err := pool.QueryRow(context.Background(),
		`SELECT id,email,password,name,role,is_admin,center,roles,photo_url,branch_id,sex,pob,dob,age,religion,phone,address1,address2,nik,npwp,education_level,institution,major,graduation_year,bank_account,status_ptkp,jabatan,show_in_directory FROM users WHERE id=$1`, id).Scan(
		&u.ID, &u.Email, &u.Password, &u.Name, &u.Role, &u.IsAdmin,
		&u.Center, &u.Roles, &u.PhotoURL, &branchID, &u.Sex, &u.PoB, &u.DoB, &u.Age,
		&u.Religion, &u.Phone, &u.Address1, &u.Address2, &u.NIK, &u.NPWP,
		&u.EducationLevel, &u.Institution, &u.Major, &u.GraduationYear,
		&u.BankAccount, &u.StatusPTKP, &u.Jabatan, &u.ShowInDirectory)
	if err != nil {
		return nil, err
	}
	u.BranchID = branchID
	return &u, nil
}

func GetAllUsersMongo() ([]UserMongo, error) {
	rows, err := pool.Query(context.Background(),
		`SELECT id,email,name,role,is_admin,center,roles,photo_url,branch_id,sex,pob,dob,age,religion,phone,address1,address2,nik,npwp,education_level,institution,major,graduation_year,bank_account,status_ptkp,jabatan,show_in_directory FROM users`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []UserMongo
	for rows.Next() {
		var u UserMongo
		var branchID string
		if err := rows.Scan(&u.ID, &u.Email, &u.Name, &u.Role, &u.IsAdmin,
			&u.Center, &u.Roles, &u.PhotoURL, &branchID, &u.Sex, &u.PoB, &u.DoB, &u.Age,
			&u.Religion, &u.Phone, &u.Address1, &u.Address2, &u.NIK, &u.NPWP,
			&u.EducationLevel, &u.Institution, &u.Major, &u.GraduationYear,
			&u.BankAccount, &u.StatusPTKP, &u.Jabatan, &u.ShowInDirectory); err != nil {
			return nil, err
		}
		u.BranchID = branchID
		users = append(users, u)
	}
	return users, nil
}

func CreateUserMongo(user UserMongo) (*UserMongo, error) {
	user.ID = newUUID()
	branchID := fmt.Sprintf("%v", user.BranchID)
	_, err := pool.Exec(context.Background(),
		`INSERT INTO users (id,email,password,name,role,is_admin,center,roles,photo_url,branch_id,sex,pob,dob,age,religion,phone,address1,address2,nik,npwp,education_level,institution,major,graduation_year,bank_account,status_ptkp,jabatan,show_in_directory) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28)`,
		user.ID, user.Email, user.Password, user.Name, user.Role, user.IsAdmin,
		user.Center, user.Roles, user.PhotoURL, branchID, user.Sex, user.PoB, user.DoB, user.Age,
		user.Religion, user.Phone, user.Address1, user.Address2, user.NIK, user.NPWP,
		user.EducationLevel, user.Institution, user.Major, user.GraduationYear,
		user.BankAccount, user.StatusPTKP, user.Jabatan, user.ShowInDirectory)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func UpdateUserMongo(id string, user UserMongo) error {
	branchID := fmt.Sprintf("%v", user.BranchID)
	_, err := pool.Exec(context.Background(),
		`UPDATE users SET email=$2,password=$3,name=$4,role=$5,is_admin=$6,center=$7,roles=$8,photo_url=$9,branch_id=$10,sex=$11,pob=$12,dob=$13,age=$14,religion=$15,phone=$16,address1=$17,address2=$18,nik=$19,npwp=$20,education_level=$21,institution=$22,major=$23,graduation_year=$24,bank_account=$25,status_ptkp=$26,jabatan=$27,show_in_directory=$28 WHERE id=$1`,
		id, user.Email, user.Password, user.Name, user.Role, user.IsAdmin,
		user.Center, user.Roles, user.PhotoURL, branchID, user.Sex, user.PoB, user.DoB, user.Age,
		user.Religion, user.Phone, user.Address1, user.Address2, user.NIK, user.NPWP,
		user.EducationLevel, user.Institution, user.Major, user.GraduationYear,
		user.BankAccount, user.StatusPTKP, user.Jabatan, user.ShowInDirectory)
	return err
}

func DeleteUserMongo(id string) error {
	_, err := pool.Exec(context.Background(), `DELETE FROM users WHERE id=$1`, id)
	return err
}

func ClearUserBranchID(branchID string) error {
	_, err := pool.Exec(context.Background(), `UPDATE users SET branch_id='' WHERE branch_id=$1`, branchID)
	return err
}
