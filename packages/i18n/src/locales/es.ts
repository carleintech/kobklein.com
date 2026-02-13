/**
 * Español (es) — KobKlein Traducciones Compartidas
 */
const es = {
  common: {
    appName: "KobKlein",
    continue: "Continuar",
    cancel: "Cancelar",
    confirm: "Confirmar",
    save: "Guardar",
    done: "Hecho",
    next: "Siguiente",
    back: "Atrás",
    retry: "Reintentar",
    close: "Cerrar",
    search: "Buscar",
    seeAll: "Ver Todo",
    loading: "Cargando...",
    noResults: "Sin resultados",
    submit: "Enviar",
    edit: "Editar",
    delete: "Eliminar",
    yes: "Sí",
    no: "No",
  },

  auth: {
    welcome: "Bienvenido a KobKlein",
    tagline: "Soberanía Financiera Digital",
    signIn: "Iniciar Sesión",
    signUp: "Crear Cuenta",
    signOut: "Cerrar Sesión",
    signingIn: "Iniciando sesión...",
    forgotPassword: "¿Olvidó su contraseña?",
    sessionExpired: "Sesión expirada. Por favor inicie sesión nuevamente.",
  },

  tabs: {
    home: "Inicio",
    wallet: "Billetera",
    send: "Enviar",
    scan: "Escanear",
    settings: "Ajustes",
  },

  dashboard: {
    greeting: "Hola, {{name}}",
    balance: "Saldo Total",
    quickActions: "Acciones Rápidas",
    recentActivity: "Actividad Reciente",
    noActivity: "Sin actividad reciente",
  },

  wallet: {
    title: "Billetera",
    htg: "Gourde Haitiano",
    usd: "Dólar Estadounidense",
    history: "Historial de Transacciones",
    noTransactions: "Sin transacciones aún",
    receive: "Recibir",
    topUp: "Recargar",
  },

  send: {
    title: "Enviar Dinero",
    to: "A",
    amount: "Monto",
    currency: "Moneda",
    preview: "Vista Previa",
    confirm: "Confirmar Transferencia",
    rate: "Tipo de Cambio",
    fee: "Comisión",
    total: "Total",
    theyReceive: "Ellos Reciben",
    success: "¡Transferencia Enviada!",
    enterOtp: "Ingrese el código de verificación",
    otpSent: "Código enviado al {{phone}}",
  },

  recipients: {
    title: "Destinatarios",
    addNew: "Agregar Destinatario",
    recent: "Recientes",
    favorites: "Favoritos",
    searchPlaceholder: "Buscar por nombre, K-ID o teléfono",
  },

  pay: {
    title: "Escanear para Pagar",
    scanQr: "Escanear Código QR",
    myQr: "Mi Código QR",
    shareQr: "Comparte tu código QR para recibir pagos",
  },

  merchant: {
    title: "Panel del Comerciante",
    pos: "Terminal POS",
    enterAmount: "Ingresar Monto",
    generateQr: "Generar QR",
    waitingPayment: "Esperando pago...",
    paymentReceived: "¡Pago Recibido!",
    todaySales: "Ventas de Hoy",
    weekSales: "Esta Semana",
    withdraw: "Retirar",
    requestSettlement: "Solicitar Liquidación",
  },

  distributor: {
    title: "Panel del Distribuidor",
    float: "Saldo Float",
    cashIn: "Depósito",
    cashOut: "Retiro",
    commissions: "Comisiones",
    availableCash: "Efectivo Disponible",
    reserved: "Reservado",
    requestRecharge: "Solicitar Recarga",
    lowFloat: "Float bajo — solicite una recarga",
  },

  diaspora: {
    title: "Panel de la Diáspora",
    family: "Mi Familia",
    addMember: "Agregar Familiar",
    sendHome: "Enviar a Casa",
    recurring: "Transferencias Recurrentes",
    walletBalance: "Saldo de Billetera",
    selectFamily: "Seleccionar Familiar",
    sendMoney: "Enviar Dinero",
    amount: "Monto",
    successSent: "Transferencia enviada con éxito",
  },

  settings: {
    title: "Ajustes",
    profile: "Perfil",
    security: "Seguridad",
    language: "Idioma",
    notifications: "Notificaciones",
    kyc: "Verificación",
    plan: "Mi Plan",
    help: "Ayuda y Soporte",
    about: "Acerca de KobKlein",
    version: "Versión {{version}}",
  },

  security: {
    lockAccount: "Bloquear Cuenta",
    devices: "Dispositivos de Confianza",
    biometric: "Inicio Biométrico",
    pin: "Cambiar PIN",
  },

  kyc: {
    unverified: "No Verificado",
    pending: "Verificación Pendiente",
    verified: "Verificado",
    rejected: "Verificación Rechazada",
    startVerification: "Iniciar Verificación",
    tier1: "Básico (Nivel 1)",
    tier2: "Completo (Nivel 2)",
  },

  notifications: {
    title: "Notificaciones",
    empty: "Sin notificaciones",
    markRead: "Marcar todo como leído",
  },

  admin: {
    title: "Panel de Administración",
    users: "Usuarios",
    transactions: "Transacciones",
    distributors: "Distribuidores",
    merchants: "Comerciantes",
    compliance: "Cumplimiento",
    risk: "Motor de Riesgo",
    aml: "Monitoreo AML",
    fx: "Tipos de Cambio",
    analytics: "Análisis",
    settings: "Configuración del Sistema",
    recharges: "Recargas",
    cases: "Casos",
    treasury: "Tesorería",
  },

  errors: {
    generic: "Algo salió mal. Por favor intente de nuevo.",
    network: "Sin conexión a internet",
    unauthorized: "Sesión expirada. Por favor inicie sesión.",
    frozen: "Su cuenta está bloqueada. Contacte soporte.",
    notFound: "No encontrado",
    forbidden: "Acceso denegado",
  },
};

export default es;
