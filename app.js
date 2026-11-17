'use strict';

/**
 * Унікальні ключі для localStorage, щоб уникнути колізій
 */
const STORAGE_KEYS = {
    DEPARTMENTS: 'lab4_app_departments_v1',
    TEACHERS: 'lab4_app_teachers_v1'
};

/**
 * Стан застосунку в пам'яті
 */
let state = {
    departments: [],
    teachers: []
};

/**
 * Посилання на DOM-елементи
 */
const dom = {
    deptForm: document.getElementById('department-form'),
    deptNameInput: document.getElementById('dept-name'),
    deptCodeInput: document.getElementById('dept-code'),
    deptTbody: document.getElementById('departments-tbody'),

    teacherForm: document.getElementById('teacher-form'),
    teacherNameInput: document.getElementById('teacher-name'),
    teacherDeptSelect: document.getElementById('teacher-dept-select'),
    teacherSubmitBtn: document.getElementById('teacher-submit-btn'),
    teachersTbody: document.getElementById('teachers-tbody')
};

/**
 * Генератор унікальних ідентифікаторів
 */
function createId() {
    return Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
}

/**
 * Вимога №1 та №2: Завантаження даних із localStorage при старті або оновленні
 */
function loadFromStorage() {
    try {
        const rawDepts = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
        const rawTeachers = localStorage.getItem(STORAGE_KEYS.TEACHERS);

        state.departments = rawDepts ? JSON.parse(rawDepts) : [];
        state.teachers = rawTeachers ? JSON.parse(rawTeachers) : [];
    } catch (error) {
        console.error('Помилка читання localStorage:', error);
        state.departments = [];
        state.teachers = [];
    }
}

/**
 * Вимога №1: Збереження поточного стану в localStorage
 */
function saveToStorage() {
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(state.departments));
    localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(state.teachers));
}

/**
 * Вимога №4: Оновлення випадного списку <select> на основі таблиці кафедр
 */
function renderDepartmentSelect() {
    const previousSelectedValue = dom.teacherDeptSelect.value;

    // Очищуємо список
    dom.teacherDeptSelect.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    defaultOption.textContent = state.departments.length > 0
        ? '-- Оберіть кафедру зі списку --'
        : '-- Спочатку додайте хоча б одну кафедру --';
    dom.teacherDeptSelect.appendChild(defaultOption);

    // Наповнюємо актуальними кафедрами
    state.departments.forEach((dept) => {
        const option = document.createElement('option');
        option.value = dept.id;
        option.textContent = `${dept.name} (${dept.code})`;
        dom.teacherDeptSelect.appendChild(option);
    });

    // Відновлюємо вибір користувача, якщо ця кафедра все ще існує
    if (state.departments.some((d) => d.id === previousSelectedValue)) {
        dom.teacherDeptSelect.value = previousSelectedValue;
    }

    // Блокуємо кнопку додавання викладача, якщо довідник кафедр порожній
    dom.teacherSubmitBtn.disabled = state.departments.length === 0;
}

/**
 * Рендер таблиці кафедр
 */
function renderDepartmentsTable() {
    dom.deptTbody.innerHTML = '';

    if (state.departments.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="4">Немає збережених кафедр</td>';
        dom.deptTbody.appendChild(emptyRow);
        return;
    }

    state.departments.forEach((dept) => {
        const tr = document.createElement('tr');

        const tdId = document.createElement('td');
        tdId.textContent = dept.id;

        const tdName = document.createElement('td');
        tdName.textContent = dept.name;

        const tdCode = document.createElement('td');
        tdCode.textContent = dept.code;

        const tdActions = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.textContent = 'Видалити';
        deleteBtn.addEventListener('click', () => handleDeleteDepartment(dept.id));

        tdActions.appendChild(deleteBtn);
        tr.append(tdId, tdName, tdCode, tdActions);
        dom.deptTbody.appendChild(tr);
    });
}

/**
 * Рендер таблиці викладачів із підтягуванням актуальної назви кафедри за ID
 */
function renderTeachersTable() {
    dom.teachersTbody.innerHTML = '';

    if (state.teachers.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="4">Немає збережених викладачів</td>';
        dom.teachersTbody.appendChild(emptyRow);
        return;
    }

    state.teachers.forEach((teacher) => {
        const tr = document.createElement('tr');

        const tdId = document.createElement('td');
        tdId.textContent = teacher.id;

        const tdName = document.createElement('td');
        tdName.textContent = teacher.fullName;

        // Пошук пов'язаної кафедри за зовнішнім ключем departmentId
        const linkedDept = state.departments.find((d) => d.id === teacher.departmentId);
        const tdDept = document.createElement('td');
        tdDept.textContent = linkedDept
            ? `${linkedDept.name} (${linkedDept.code})`
            : '[Кафедру видалено]';

        const tdActions = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.textContent = 'Видалити';
        deleteBtn.addEventListener('click', () => handleDeleteTeacher(teacher.id));

        tdActions.appendChild(deleteBtn);
        tr.append(tdId, tdName, tdDept, tdActions);
        dom.teachersTbody.appendChild(tr);
    });
}

/**
 * Повна перемальовка інтерфейсу
 */
function renderAll() {
    renderDepartmentsTable();
    renderDepartmentSelect();
    renderTeachersTable();
}

/**
 * Обробник додавання нової кафедри
 */
function handleAddDepartment(event) {
    event.preventDefault();

    const name = dom.deptNameInput.value.trim();
    const code = dom.deptCodeInput.value.trim();

    if (!name || !code) return;

    state.departments.push({
        id: createId(),
        name: name,
        code: code
    });

    saveToStorage();
    renderAll();
    dom.deptForm.reset();
}

/**
 * Обробник видалення кафедри (з перевіркою пов'язаних записів)
 */
function handleDeleteDepartment(departmentId) {
    const hasLinkedTeachers = state.teachers.some((t) => t.departmentId === departmentId);

    if (hasLinkedTeachers) {
        const confirmCascade = confirm(
            'До цієї кафедри прив’язані викладачі. Видалити кафедру разом із прив’язаними викладачами?'
        );
        if (!confirmCascade) return;

        state.teachers = state.teachers.filter((t) => t.departmentId !== departmentId);
    }

    state.departments = state.departments.filter((d) => d.id !== departmentId);

    saveToStorage();
    renderAll();
}

/**
 * Обробник додавання викладача з обов'язковою прив'язкою до кафедри зі списку
 */
function handleAddTeacher(event) {
    event.preventDefault();

    const fullName = dom.teacherNameInput.value.trim();
    const departmentId = dom.teacherDeptSelect.value;

    // Валідація: кафедра повинна існувати в масиві state.departments
    const departmentExists = state.departments.some((d) => d.id === departmentId);

    if (!fullName || !departmentExists) {
        alert('Оберіть коректну кафедру зі списку!');
        return;
    }

    state.teachers.push({
        id: createId(),
        fullName: fullName,
        departmentId: departmentId
    });

    saveToStorage();
    renderAll();
    dom.teacherForm.reset();
    renderDepartmentSelect();
}

/**
 * Обробник видалення викладача
 */
function handleDeleteTeacher(teacherId) {
    state.teachers = state.teachers.filter((t) => t.id !== teacherId);

    saveToStorage();
    renderAll();
}

/**
 * Вимога №3: Автоматична синхронізація між усіма відкритими вкладками/вікнами.
 * Подія 'storage' спрацьовує у всіх інших вкладках того ж origin при зміні localStorage.
 */
window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEYS.DEPARTMENTS || event.key === STORAGE_KEYS.TEACHERS) {
        loadFromStorage();
        renderAll();
    }
});

/**
 * Реєстрація слухачів форм та ініціалізація при завантаженні сторінки
 */
dom.deptForm.addEventListener('submit', handleAddDepartment);
dom.teacherForm.addEventListener('submit', handleAddTeacher);

document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    renderAll();
});