export type Language = 'tr' | 'en';

export interface Translations {
  // Common texts
  common: {
    appName: string;
    welcomeMessage: string;
    loading: string;
    error: string;
    success: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    create: string;
    submit: string;
    confirmation: string;
    yes: string;
    no: string;
    back: string;
    next: string;
    home: string;
    welcome: string;
    selectedDate: string;
    noEventsOnDate: string;
    selectDate: string;
  };

  // Authentication
  auth: {
    login: string;
    logout: string;
    register: string;
    username: string;
    password: string;
    confirmPassword: string;
    forgotPassword: string;
    resetPassword: string;
    rememberMe: string;
    loginSuccess: string;
    registerSuccess: string;
    logoutSuccess: string;
    approvalPending: string;
    approvalPendingMessage: string;
    approvedMessage: string;
    inactive: string;
  };

  // Navigation
  nav: {
    home: string;
    events: string;
    myProfile: string;
    participations: string;
    adminPanel: string;
    users: string;
    siteSettings: string;
  };

  // User Management
  users: {
    title: string;
    subtitle: string;
    exportToExcel: string;
    pendingUsers: string;
    approvedUsers: string;
    username: string;
    fullName: string;
    email: string;
    status: string;
    role: string;
    actions: string;
    approved: string;
    pending: string;
    active: string;
    inactive: string;
    admin: string;
    user: string;
    approveUser: string;
    makeAdmin: string;
    makeUser: string;
    deactivateUser: string;
    activateUser: string;
    exportComplete: string;
    exportMessage: string;
  };

  // Events
  events: {
    title: string;
    subtitle: string;
    addEvent: string;
    editEvent: string;
    eventTitle: string;
    eventDate: string;
    eventEndDate: string;
    location: string;
    content: string;
    description: string;
    images: string;
    listView: string;
    calendarView: string;
    eventsOn: string;
    noEvents: string;
    eventDetails: string;
    eventCreated: string;
    eventUpdated: string;
    eventDeleted: string;
    confirmDelete: string;
    confirmDeleteMessage: string;
    participants: string;
    confirmDeleteTitle: string;
  };

  // Event Participation
  participation: {
    join: string;
    participationStatus: string;
    approved: string;
    pending: string;
    roomType: string;
    roomOccupancy: string;
    participationApproved: string;
    edit: string;
    saveChanges: string;
    singleRoom: string;
    doubleRoom: string;
    tripleRoom: string;
    quadRoom: string;
    person: string;
    participationSubmitted: string;
    participationUpdated: string;
    selectRoomType: string;
    selectOccupancy: string;
  };

  // Profile
  profile: {
    title: string;
    personalInfo: string;
    contactInfo: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    birthDate: string;
    gender: string;
    male: string;
    female: string;
    other: string;
    address: string;
    city: string;
    country: string;
    occupation: string;
    company: string;
    profileUpdated: string;
    updateProfile: string;
    socialMedia: string;
    website: string;
    instagram: string;
    twitter: string;
    facebook: string;
    linkedin: string;
  };

  // Site Settings
  siteSettings: {
    title: string;
    subtitle: string;
    logoSettings: string;
    colorSettings: string;
    generalSettings: string;
    logoUrl: string;
    primaryColor: string;
    settingsSaved: string;
    dragAndDrop: string;
    chooseFile: string;
    uploadLogo: string;
  };

  // Validation
  validation: {
    required: string;
    minLength: string;
    maxLength: string;
    passwordMatch: string;
    invalidEmail: string;
    invalidPhone: string;
    invalidDate: string;
    invalidUrl: string;
  };

  // Errors
  errors: {
    genericError: string;
    notFound: string;
    notFoundMessage: string;
    unauthorized: string;
    forbidden: string;
    serverError: string;
    networkError: string;
    timeout: string;
  };
}