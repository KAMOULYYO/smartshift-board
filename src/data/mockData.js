import { getTodayDate, getWeekDates } from '../utils/helpers'
import { ROLES } from '../utils/permissions'

const today = getTodayDate()
const weekDates = getWeekDates(new Date(today))
const [mon, tue, wed, thu, fri, sat, sun] = weekDates

export const INITIAL_EMPLOYEES = [
  { id: 'emp-01', name: 'Younes Kamouly',  email: 'directeur@smartshift.fr', phone: '06 12 34 56 78', department: 'Administration',   role: ROLES.DIRECTOR,          note: 'Directeur général' },
  { id: 'emp-02', name: 'Fabrice Dumont',   email: 'fabrice.dumont@smartshift.fr', phone: '06 22 33 44 55', department: 'Administration',   role: ROLES.ASSISTANT_MANAGER, note: 'Directeur adjoint' },
  { id: 'emp-03', name: 'Makenson Pierre',  email: 'adjoint@smartshift.fr',   phone: '06 33 44 55 66', department: 'Caisse',           role: ROLES.ASSISTANT_MANAGER, note: 'Adjoint Caisse' },
  { id: 'emp-04', name: 'Sara Benali',      email: 'gerant@smartshift.fr',    phone: '06 44 55 66 77', department: 'Fruits et légumes', role: ROLES.MANAGER,           note: 'Gérante F&L' },
  { id: 'emp-05', name: 'Karim Mansouri',   email: 'employe@smartshift.fr',   phone: '06 55 66 77 88', department: 'Épicerie',         role: ROLES.EMPLOYEE,          note: '' },
  { id: 'emp-06', name: 'Lina Morel',       email: 'lina.morel@smartshift.fr',     phone: '06 66 77 88 99', department: 'Boulangerie',      role: ROLES.EMPLOYEE,          note: 'Pâtissière qualifiée' },
  { id: 'emp-07', name: 'Amine Chaoui',     email: 'amine.chaoui@smartshift.fr',   phone: '06 77 88 99 00', department: 'Viande',           role: ROLES.EMPLOYEE,          note: 'Boucher expérimenté' },
  { id: 'emp-08', name: 'Nadia Fournier',   email: 'nadia.fournier@smartshift.fr', phone: '06 88 99 00 11', department: 'Produits laitiers',role: ROLES.EMPLOYEE,          note: '' },
  { id: 'emp-09', name: 'Thomas Legrand',   email: 'thomas.legrand@smartshift.fr', phone: '06 11 22 33 44', department: 'Réception',        role: ROLES.EMPLOYEE,          note: '' },
  { id: 'emp-10', name: 'Camille Roux',     email: 'camille.roux@smartshift.fr',   phone: '06 22 11 00 99', department: 'Caisse',           role: ROLES.EMPLOYEE,          note: '' },
  { id: 'emp-11', name: 'Baptiste Leclerc', email: 'baptiste.leclerc@smartshift.fr',phone:'06 33 22 11 00', department: 'Épicerie',         role: ROLES.EMPLOYEE,          note: '' },
  { id: 'emp-12', name: 'Inès Hamdi',       email: 'ines.hamdi@smartshift.fr',     phone: '06 44 33 22 11', department: 'Fruits et légumes', role: ROLES.EMPLOYEE,         note: '' },
  { id: 'emp-13', name: 'Julien Marty',     email: 'julien.marty@smartshift.fr',   phone: '06 55 44 33 22', department: 'Caisse',           role: ROLES.MANAGER,           note: 'Gérant Caisse' },
  { id: 'emp-14', name: 'Anissa Saïdi',     email: 'anissa.saidi@smartshift.fr',   phone: '06 66 55 44 33', department: 'Boulangerie',      role: ROLES.EMPLOYEE,          note: '' },
  { id: 'emp-15', name: 'Rémi Garnier',     email: 'remi.garnier@smartshift.fr',   phone: '06 77 66 55 44', department: 'Viande',           role: ROLES.EMPLOYEE,          note: '' },
  { id: 'emp-16', name: 'Soraya Touati',    email: 'soraya.touati@smartshift.fr',  phone: '06 88 77 66 55', department: 'Produits laitiers',role: ROLES.EMPLOYEE,          note: '' },
  { id: 'emp-17', name: 'Nicolas Petit',    email: 'nicolas.petit@smartshift.fr',  phone: '06 99 88 77 66', department: 'Réception',        role: ROLES.EMPLOYEE,          note: '' },
  { id: 'emp-18', name: 'Fatima Zohra',     email: 'fatima.zohra@smartshift.fr',   phone: '06 10 20 30 40', department: 'Épicerie',         role: ROLES.EMPLOYEE,          note: '' },
  { id: 'emp-19', name: 'Alexis Bonnet',    email: 'alexis.bonnet@smartshift.fr',  phone: '06 20 30 40 50', department: 'Caisse',           role: ROLES.EMPLOYEE,          note: '' },
  { id: 'emp-20', name: 'Dounia Bensalem',  email: 'dounia.bensalem@smartshift.fr',phone: '06 30 40 50 60', department: 'Administration',   role: ROLES.ASSISTANT_MANAGER, note: 'RH & Planning' },
]

export const INITIAL_SHIFTS = [
  // Lundi
  { id: 's-01', employeeId: 'emp-03', department: 'Caisse',           date: mon, startTime: '08:00', endTime: '16:00', status: 'planned', note: '' },
  { id: 's-02', employeeId: 'emp-10', department: 'Caisse',           date: mon, startTime: '14:00', endTime: '21:00', status: 'planned', note: '' },
  { id: 's-03', employeeId: 'emp-04', department: 'Fruits et légumes',date: mon, startTime: '07:00', endTime: '15:00', status: 'planned', note: '' },
  { id: 's-04', employeeId: 'emp-05', department: 'Épicerie',         date: mon, startTime: '09:00', endTime: '17:00', status: 'planned', note: '' },
  { id: 's-05', employeeId: 'emp-06', department: 'Boulangerie',      date: mon, startTime: '05:00', endTime: '13:00', status: 'planned', note: '' },
  { id: 's-06', employeeId: 'emp-07', department: 'Viande',           date: mon, startTime: '08:00', endTime: '16:00', status: 'planned', note: '' },
  { id: 's-07', employeeId: 'emp-08', department: 'Produits laitiers',date: mon, startTime: '10:00', endTime: '18:00', status: 'absent',  note: 'Absent — maladie' },
  { id: 's-08', employeeId: 'emp-09', department: 'Réception',        date: mon, startTime: '08:00', endTime: '16:00', status: 'planned', note: '' },
  // Mardi
  { id: 's-09', employeeId: 'emp-03', department: 'Caisse',           date: tue, startTime: '08:00', endTime: '16:00', status: 'planned', note: '' },
  { id: 's-10', employeeId: 'emp-13', department: 'Caisse',           date: tue, startTime: '14:00', endTime: '21:00', status: 'planned', note: '' },
  { id: 's-11', employeeId: 'emp-12', department: 'Fruits et légumes',date: tue, startTime: '07:00', endTime: '15:00', status: 'planned', note: '' },
  { id: 's-12', employeeId: 'emp-11', department: 'Épicerie',         date: tue, startTime: '09:00', endTime: '17:00', status: 'planned', note: '' },
  { id: 's-13', employeeId: 'emp-14', department: 'Boulangerie',      date: tue, startTime: '05:00', endTime: '13:00', status: 'planned', note: '' },
  { id: 's-14', employeeId: 'emp-15', department: 'Viande',           date: tue, startTime: '08:00', endTime: '16:00', status: 'planned', note: '' },
  { id: 's-15', employeeId: 'emp-16', department: 'Produits laitiers',date: tue, startTime: '10:00', endTime: '18:00', status: 'planned', note: '' },
  { id: 's-16', employeeId: 'emp-17', department: 'Réception',        date: tue, startTime: '08:00', endTime: '16:00', status: 'planned', note: '' },
  // Mercredi
  { id: 's-17', employeeId: 'emp-03', department: 'Caisse',           date: wed, startTime: '08:00', endTime: '16:00', status: 'planned', note: '' },
  { id: 's-18', employeeId: 'emp-19', department: 'Caisse',           date: wed, startTime: '14:00', endTime: '21:00', status: 'planned', note: '' },
  { id: 's-19', employeeId: 'emp-04', department: 'Fruits et légumes',date: wed, startTime: '07:00', endTime: '15:00', status: 'planned', note: '' },
  { id: 's-20', employeeId: 'emp-18', department: 'Épicerie',         date: wed, startTime: '09:00', endTime: '17:00', status: 'planned', note: '' },
  { id: 's-21', employeeId: 'emp-06', department: 'Boulangerie',      date: wed, startTime: '05:00', endTime: '13:00', status: 'planned', note: '' },
  { id: 's-22', employeeId: 'emp-07', department: 'Viande',           date: wed, startTime: '08:00', endTime: '16:00', status: 'replaced',note: '' },
  { id: 's-23', employeeId: 'emp-08', department: 'Produits laitiers',date: wed, startTime: '10:00', endTime: '18:00', status: 'planned', note: '' },
  // Jeudi
  { id: 's-24', employeeId: 'emp-10', department: 'Caisse',           date: thu, startTime: '08:00', endTime: '16:00', status: 'planned', note: '' },
  { id: 's-25', employeeId: 'emp-13', department: 'Caisse',           date: thu, startTime: '14:00', endTime: '21:00', status: 'planned', note: '' },
  { id: 's-26', employeeId: 'emp-12', department: 'Fruits et légumes',date: thu, startTime: '07:00', endTime: '15:00', status: 'planned', note: '' },
  { id: 's-27', employeeId: 'emp-05', department: 'Épicerie',         date: thu, startTime: '09:00', endTime: '17:00', status: 'planned', note: '' },
  { id: 's-28', employeeId: 'emp-15', department: 'Viande',           date: thu, startTime: '08:00', endTime: '16:00', status: 'planned', note: '' },
  // Vendredi
  { id: 's-29', employeeId: 'emp-03', department: 'Caisse',           date: fri, startTime: '08:00', endTime: '16:00', status: 'planned', note: '' },
  { id: 's-30', employeeId: 'emp-19', department: 'Caisse',           date: fri, startTime: '14:00', endTime: '21:00', status: 'planned', note: '' },
  { id: 's-31', employeeId: 'emp-04', department: 'Fruits et légumes',date: fri, startTime: '07:00', endTime: '15:00', status: 'planned', note: '' },
  { id: 's-32', employeeId: 'emp-11', department: 'Épicerie',         date: fri, startTime: '09:00', endTime: '17:00', status: 'planned', note: '' },
  { id: 's-33', employeeId: 'emp-06', department: 'Boulangerie',      date: fri, startTime: '05:00', endTime: '13:00', status: 'planned', note: '' },
  { id: 's-34', employeeId: 'emp-14', department: 'Boulangerie',      date: fri, startTime: '12:00', endTime: '20:00', status: 'planned', note: '' },
  // Samedi
  { id: 's-35', employeeId: 'emp-10', department: 'Caisse',           date: sat, startTime: '09:00', endTime: '17:00', status: 'planned', note: '' },
  { id: 's-36', employeeId: 'emp-13', department: 'Caisse',           date: sat, startTime: '12:00', endTime: '20:00', status: 'planned', note: '' },
  { id: 's-37', employeeId: 'emp-12', department: 'Fruits et légumes',date: sat, startTime: '08:00', endTime: '16:00', status: 'planned', note: '' },
  { id: 's-38', employeeId: 'emp-07', department: 'Viande',           date: sat, startTime: '07:00', endTime: '14:00', status: 'planned', note: '' },
  { id: 's-39', employeeId: 'emp-15', department: 'Viande',           date: sat, startTime: '14:00', endTime: '21:00', status: 'planned', note: '' },
]

export const INITIAL_ABSENCES = [
  { id: 'abs-01', employeeId: 'emp-08', department: 'Produits laitiers', date: mon, reason: 'Maladie',           urgency: 'high',   comment: 'Certificat médical fourni',     status: 'accepted' },
  { id: 'abs-02', employeeId: 'emp-07', department: 'Viande',            date: wed, reason: 'Rendez-vous médical',urgency: 'medium', comment: 'Retour prévu jeudi',            status: 'accepted' },
  { id: 'abs-03', employeeId: 'emp-12', department: 'Fruits et légumes', date: fri, reason: 'Congé payé',        urgency: 'low',    comment: "Demandé 2 semaines à l'avance", status: 'pending' },
  { id: 'abs-04', employeeId: 'emp-11', department: 'Épicerie',          date: sat, reason: 'Urgence familiale', urgency: 'high',   comment: '',                              status: 'pending' },
  { id: 'abs-05', employeeId: 'emp-14', department: 'Boulangerie',       date: sun, reason: 'Congé personnel',   urgency: 'low',    comment: '',                              status: 'refused' },
]

export const INITIAL_REPLACEMENTS = [
  { id: 'rep-01', shiftId: 's-07', absenceId: 'abs-01', originalEmployeeId: 'emp-08', replacementEmployeeId: 'emp-16', department: 'Produits laitiers', date: mon, startTime: '10:00', endTime: '18:00', status: 'assigned' },
  { id: 'rep-02', shiftId: 's-22', absenceId: 'abs-02', originalEmployeeId: 'emp-07', replacementEmployeeId: null,     department: 'Viande',            date: wed, startTime: '08:00', endTime: '16:00', status: 'open' },
]

export const INITIAL_AVAILABILITIES = [
  { id: 'av-01', employeeId: 'emp-03', day: 'monday',    type: 'available',   startTime: '08:00', endTime: '20:00', note: '' },
  { id: 'av-02', employeeId: 'emp-03', day: 'tuesday',   type: 'available',   startTime: '08:00', endTime: '20:00', note: '' },
  { id: 'av-03', employeeId: 'emp-03', day: 'wednesday', type: 'available',   startTime: '08:00', endTime: '20:00', note: '' },
  { id: 'av-04', employeeId: 'emp-03', day: 'sunday',    type: 'unavailable', startTime: '',      endTime: '',      note: 'Repos famille' },
  { id: 'av-05', employeeId: 'emp-04', day: 'monday',    type: 'available',   startTime: '06:00', endTime: '16:00', note: '' },
  { id: 'av-06', employeeId: 'emp-04', day: 'saturday',  type: 'partial',     startTime: '09:00', endTime: '14:00', note: '' },
  { id: 'av-07', employeeId: 'emp-06', day: 'monday',    type: 'available',   startTime: '05:00', endTime: '14:00', note: '' },
  { id: 'av-08', employeeId: 'emp-06', day: 'sunday',    type: 'unavailable', startTime: '',      endTime: '',      note: '' },
  { id: 'av-09', employeeId: 'emp-08', day: 'monday',    type: 'unavailable', startTime: '',      endTime: '',      note: 'Congé maladie' },
  { id: 'av-10', employeeId: 'emp-10', day: 'thursday',  type: 'available',   startTime: '08:00', endTime: '18:00', note: '' },
  { id: 'av-11', employeeId: 'emp-11', day: 'friday',    type: 'available',   startTime: '09:00', endTime: '17:00', note: '' },
  { id: 'av-12', employeeId: 'emp-13', day: 'wednesday', type: 'partial',     startTime: '14:00', endTime: '21:00', note: '' },
  { id: 'av-13', employeeId: 'emp-05', day: 'monday',    type: 'available',   startTime: '09:00', endTime: '17:00', note: '' },
  { id: 'av-14', employeeId: 'emp-05', day: 'saturday',  type: 'unavailable', startTime: '',      endTime: '',      note: 'Week-end réservé' },
]

export const INITIAL_ALERTS = [
  { id: 'al-01', type: 'shortage',     department: 'Produits laitiers', message: 'Département en sous-effectif — 1 employé absent non remplacé',        priority: 'high',   date: mon },
  { id: 'al-02', type: 'replacement',  department: 'Viande',            message: 'Remplacement en attente pour Amine Chaoui le mercredi',               priority: 'high',   date: wed },
  { id: 'al-03', type: 'absence',      department: 'Fruits et légumes', message: "Demande d'absence non traitée — Inès Hamdi vendredi",                 priority: 'medium', date: fri },
  { id: 'al-04', type: 'absence',      department: 'Épicerie',          message: 'Urgence familiale signalée — Baptiste Leclerc samedi',                 priority: 'high',   date: sat },
]
