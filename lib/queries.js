const client = require('./db');

// Function to view all departments
async function viewDepartments() {
    const res = await client.query('SELECT * FROM department');
    console.table(res.rows);
}

// Function to view all roles
async function viewRoles() {
    const res = await client.query(`
        SELECT role.id, title, salary, department.name AS department
        FROM role
        JOIN department ON role.department_id = department.id
    `);
    console.table(res.rows);
}

// Function to view all employees
async function viewEmployees() {
    const res = await client.query(`
        SELECT employee.id, first_name, last_name, role.title, department.name AS department, salary, manager.first_name AS manager
        FROM employee
        JOIN role ON employee.role_id = role.id
        JOIN department ON role.department_id = department.id
        LEFT JOIN employee manager ON employee.manager_id = manager.id
    `);
    console.table(res.rows);
}

// Export the functions
module.exports = {
    viewDepartments,
    viewRoles,
    viewEmployees,
    // Add other query functions here
};
