MANAGER_ROLES = {"director", "assistant_manager", "manager"}
DEPARTMENT_MANAGER_ROLES = {"assistant_manager", "manager"}


def is_director(user: dict) -> bool:
    return user.get("role") == "director"


def is_manager_level(user: dict) -> bool:
    return user.get("role") in MANAGER_ROLES


def is_department_manager(user: dict) -> bool:
    return user.get("role") in DEPARTMENT_MANAGER_ROLES


def can_access_department(user: dict, department: str) -> bool:
    if is_director(user):
        return True
    return user.get("department") == department


def can_view_employee(user: dict, employee: dict) -> bool:
    if is_director(user):
        return True
    if is_department_manager(user):
        return employee.get("department") == user.get("department")
    return employee.get("id") == user.get("id")


def can_manage_employee(user: dict, employee: dict) -> bool:
    if not is_manager_level(user):
        return False
    if employee.get("role") == "director" and not is_director(user):
        return False
    if is_director(user):
        return True
    return employee.get("department") == user.get("department")


def can_manage_shift(user: dict, shift: dict) -> bool:
    if not is_manager_level(user):
        return False
    if is_director(user):
        return True
    return shift.get("department") == user.get("department")


def can_manage_absence(user: dict, absence: dict) -> bool:
    if not is_manager_level(user):
        return False
    if is_director(user):
        return True
    return absence.get("department") == user.get("department")


def can_manage_replacement(user: dict, replacement: dict) -> bool:
    if not is_manager_level(user):
        return False
    if is_director(user):
        return True
    return replacement.get("department") == user.get("department")


def can_view_global_reports(user: dict) -> bool:
    return is_director(user)
