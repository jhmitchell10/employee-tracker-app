const inquirer = require('inquirer');
const db = require('./db');

async function mainMenu() {
  const { choice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: 'What would you like to do?',
      choices: [
        'View all departments',
        'View all roles',
        'View all employees',
        'Add a department',
        'Add a role',
        'Add an employee',
        'Update an employee role',
        'Exit'
      ]
    }
  ]);

  switch (choice) {
    case 'View all departments':
      await viewAllDepartments();
      break;
    case 'View all roles':
      await viewAllRoles();
      break;
    case 'View all employees':
      await viewAllEmployees();
      break;
    case 'Add a department':
      await addDepartment();
      break;
    case 'Add a role':
      await addRole();
      break;
    case 'Add an employee':
      await addEmployee();
      break;
    case 'Update an employee role':
      await updateEmployeeRole();
      break;
    case 'Exit':
      console.log('Goodbye!');
      process.exit(0);
  }

  mainMenu();
}

async function viewAllDepartments() {
  const departments = await db.query('SELECT * FROM department');
  console.table(departments.rows);
}

async function viewAllRoles() {
  const roles = await db.query(`
    SELECT role.id, role.title, department.name AS department, role.salary
    FROM role
    JOIN department ON role.department_id = department.id
  `);
  console.table(roles.rows);
}

async function viewAllEmployees() {
  const employees = await db.query(`
    SELECT 
      e.id, 
      e.first_name, 
      e.last_name, 
      role.title, 
      department.name AS department, 
      role.salary, 
      CONCAT(m.first_name, ' ', m.last_name) AS manager
    FROM employee e
    LEFT JOIN role ON e.role_id = role.id
    LEFT JOIN department ON role.department_id = department.id
    LEFT JOIN employee m ON e.manager_id = m.id
  `);
  console.table(employees.rows);
}

async function addDepartment() {
  const { name } = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'What is the name of the department?'
    }
  ]);

  await db.query('INSERT INTO department (name) VALUES ($1)', [name]);
  console.log(`Added ${name} to departments.`);
}

async function addRole() {
  const departments = await db.query('SELECT * FROM department');
  const { title, salary, departmentId } = await inquirer.prompt([
    {
      type: 'input',
      name: 'title',
      message: 'What is the title of the role?'
    },
    {
      type: 'input',
      name: 'salary',
      message: 'What is the salary for this role?',
      validate: input => !isNaN(input) || 'Please enter a valid number'
    },
    {
      type: 'list',
      name: 'departmentId',
      message: 'Which department does this role belong to?',
      choices: departments.rows.map(dept => ({ name: dept.name, value: dept.id }))
    }
  ]);

  await db.query('INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3)', [title, salary, departmentId]);
  console.log(`Added ${title} to roles.`);
}

async function addEmployee() {
  const roles = await db.query('SELECT * FROM role');
  const employees = await db.query('SELECT * FROM employee');
  
  const { firstName, lastName, roleId, managerId } = await inquirer.prompt([
    {
      type: 'input',
      name: 'firstName',
      message: "What is the employee's first name?"
    },
    {
      type: 'input',
      name: 'lastName',
      message: "What is the employee's last name?"
    },
    {
      type: 'list',
      name: 'roleId',
      message: "What is the employee's role?",
      choices: roles.rows.map(role => ({ name: role.title, value: role.id }))
    },
    {
      type: 'list',
      name: 'managerId',
      message: "Who is the employee's manager?",
      choices: [
        { name: 'None', value: null },
        ...employees.rows.map(emp => ({ name: `${emp.first_name} ${emp.last_name}`, value: emp.id }))
      ]
    }
  ]);

  await db.query('INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)', [firstName, lastName, roleId, managerId]);
  console.log(`Added ${firstName} ${lastName} to employees.`);
}

async function updateEmployeeRole() {
  const employees = await db.query('SELECT * FROM employee');
  const roles = await db.query('SELECT * FROM role');

  const { employeeId, roleId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'employeeId',
      message: 'Which employee\'s role do you want to update?',
      choices: employees.rows.map(emp => ({ name: `${emp.first_name} ${emp.last_name}`, value: emp.id }))
    },
    {
      type: 'list',
      name: 'roleId',
      message: 'Which role do you want to assign to the selected employee?',
      choices: roles.rows.map(role => ({ name: role.title, value: role.id }))
    }
  ]);

  await db.query('UPDATE employee SET role_id = $1 WHERE id = $2', [roleId, employeeId]);
  console.log(`Updated employee's role.`);
}

async function main() {
  try {
    await db.connect();
    console.log('Welcome to the Employee Management System!');
    mainMenu();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
