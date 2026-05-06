export type Language = 'en' | 'es'

type OptionTranslation = { label?: string; description?: string }

type FieldTranslation = {
  label?: string
  helpText?: string
  placeholder?: string
  options?: Record<string, OptionTranslation>
}

export type StepTranslation = {
  title?: string
  subtitle?: string
  fields?: Record<string, FieldTranslation>
}

export const ES_STEPS: Record<string, StepTranslation> = {
  status: {
    title: '¿Cuál es su estatus migratorio?',
    subtitle:
      'Este es el factor más importante para determinar sus opciones de seguro médico. Sus respuestas solo se usan para calcular elegibilidad — nunca se guardan en un servidor ni se comparten.',
    fields: {
      immigrationStatus: {
        label: 'Estatus migratorio',
        helpText: 'Seleccione la opción que mejor describe su situación actual en los EE. UU.',
        options: {
          us_citizen: { label: 'Ciudadano(a) estadounidense', description: 'Nacido en los EE. UU. o naturalizado' },
          green_card: { label: 'Tarjeta verde (Residente permanente)', description: 'Residente permanente legal' },
          h1b: { label: 'Visa de trabajo H-1B', description: 'Ocupación especializada patrocinada por empleador' },
          h4: { label: 'Dependiente H-4', description: 'Cónyuge o hijo de titular de H-1B' },
          f1_student: { label: 'Visa de estudiante F-1', description: 'Estudiante internacional' },
          f1_opt: { label: 'F-1 OPT', description: 'Práctica profesional opcional después de graduación' },
          j1_scholar: { label: 'Visitante de intercambio J-1', description: 'Investigación, enseñanza o intercambio cultural' },
          j2: { label: 'Dependiente J-2', description: 'Cónyuge o hijo de titular de J-1' },
          l1: { label: 'Transferencia intraempresarial L-1', description: 'Empleado transferido de multinacional' },
          o1: { label: 'Habilidad extraordinaria O-1', description: 'Visa para personas con talento excepcional' },
          tn: { label: 'Visa TN (NAFTA/USMCA)', description: 'Profesional canadiense o mexicano' },
          daca: { label: 'DACA', description: 'Acción Diferida para los Llegados en la Infancia' },
          refugee_asylee: { label: 'Refugiado(a) o asilado(a)', description: 'Con estatus de refugiado o asilo otorgado' },
          tps: {
            label: 'Estatus de Protección Temporal (TPS)',
            description: 'TPS otorgado por conflicto armado, desastre u otras condiciones en el país de origen',
          },
          parolee: {
            label: 'Parolado humanitario',
            description: 'Admitido en los EE. UU. por razones humanitarias (afgano, ucraniano, cubano/haitiano, etc.)',
          },
          undocumented: { label: 'Indocumentado(a) / Sin estatus legal', description: 'Sin estatus migratorio legal actual' },
          other: { label: 'Otro / No está en la lista', description: 'Mi estatus no aparece arriba' },
        },
      },
      yearsAsLPR: {
        label: '¿Cuántos años lleva con su tarjeta verde?',
        helpText:
          'La regla de los 5 años es una norma federal que retrasa la elegibilidad de Medicaid para la mayoría de los titulares de tarjeta verde. Algunos estados (CA, NY, MA, WA y otros) cubren el período de espera con fondos propios.',
        options: {
          '0': { label: 'Menos de 1 año' },
          '1': { label: '1–2 años' },
          '3': { label: '3–4 años' },
          '5': { label: '5 años o más' },
        },
      },
    },
  },

  location: {
    title: '¿Dónde vive?',
    subtitle:
      'Las reglas de seguro médico, la expansión de Medicaid y los programas disponibles varían mucho según el estado.',
    fields: {
      state: {
        label: 'Estado de residencia',
        helpText:
          'Seleccione su estado actual. Esto afecta la elegibilidad de Medicaid, las opciones del mercado y los programas disponibles.',
      },
      zipCode: {
        label: 'Código postal',
        placeholder: 'p. ej. 94539',
        helpText: 'Se usa para encontrar planes de seguro disponibles en su área. No se guarda después de esta sesión.',
      },
    },
  },

  employment: {
    title: '¿Cuál es su situación laboral actual?',
    subtitle: 'Su situación laboral determina qué planes están disponibles y cuándo puede inscribirse.',
    fields: {
      employmentStatus: {
        label: 'Situación laboral',
        options: {
          employed_fulltime: {
            label: 'Empleado(a) a tiempo completo (30+ horas/semana)',
            description: 'Trabajando para un empleador',
          },
          employed_parttime: {
            label: 'Empleado(a) a tiempo parcial (<30 horas/semana)',
            description: 'Tiempo parcial, por horas o estacional',
          },
          self_employed: {
            label: 'Trabajador(a) independiente o autónomo(a)',
            description: 'Contratista independiente, trabajo por encargo o negocio propio',
          },
          student: { label: 'Estudiante (sin trabajo actualmente)', description: 'Estudiante a tiempo completo o parcial' },
          dependent: {
            label: 'Sin autorización de trabajo (dependiente)',
            description: 'H-4, J-2 u otro estatus sin autorización de trabajo — ingresos del cónyuge o padre',
          },
          unemployed_seeking: {
            label: 'Desempleado(a) — buscando trabajo activamente',
            description: 'Actualmente en búsqueda de empleo',
          },
          unemployed_not_seeking: {
            label: 'Desempleado(a) — no busca trabajo',
            description: 'No está buscando empleo actualmente',
          },
          retired: { label: 'Jubilado(a)', description: 'Ya no trabaja' },
        },
      },
      employerName: {
        label: '¿Para qué empresa trabaja?',
        placeholder: 'p. ej. Google, Hospital General, Propio (contratista)',
        helpText: 'Nos ayuda a identificar si su empleador tiene una ventana de beneficios conocida.',
      },
      hasEmployerInsurance: {
        label: '¿Su empleador ofrece seguro médico?',
        helpText:
          'Aunque aún no se haya inscrito, díganos si su empleador ofrece cobertura. De ser así, igual le ayudaremos a compararlo con las opciones del mercado para que tome la mejor decisión.',
      },
      employerOpenEnrollmentMonth: {
        label: '¿Cuándo es la inscripción abierta de su empleador?',
        helpText: 'Agregaremos un recordatorio a su cronograma de inscripción.',
        options: {
          january: { label: 'Enero' },
          february: { label: 'Febrero' },
          march: { label: 'Marzo' },
          april: { label: 'Abril' },
          may: { label: 'Mayo' },
          june: { label: 'Junio' },
          july: { label: 'Julio' },
          august: { label: 'Agosto' },
          september: { label: 'Septiembre' },
          october: { label: 'Octubre' },
          november: { label: 'Noviembre (el más común)' },
          december: { label: 'Diciembre' },
          unknown: { label: 'No estoy seguro(a)' },
        },
      },
      currentEmployerPlan: {
        label: '¿En qué plan está inscrito(a) actualmente?',
        placeholder: 'p. ej. Anthem PPO, Kaiser HMO Gold, Aetna HDHP',
        helpText:
          'Revise su tarjeta de seguro o el portal de recursos humanos. Esto nos ayuda a comparar su plan actual con otras opciones en la inscripción abierta.',
      },
      hasHSA: {
        label: '¿Tiene actualmente una Cuenta de Ahorros para la Salud (HSA)?',
        helpText:
          'Las HSA se combinan con planes de alta deducible y ofrecen ventajas fiscales para los trabajadores independientes.',
      },
      jobSearchTimeline: {
        label: '¿En cuánto tiempo espera encontrar trabajo?',
        helpText:
          'Esto determina si un plan de corto plazo o un plan del mercado ACA tiene más sentido.',
        options: {
          less_than_3mo: { label: 'En menos de 3 meses', description: 'Entrevistando activamente' },
          '3_to_6mo': { label: '3–6 meses', description: 'En etapas iniciales de búsqueda' },
          over_6mo: { label: 'Más de 6 meses', description: 'Transición a largo plazo' },
        },
      },
      formerEmployerInsurance: {
        label: '¿Su trabajo anterior ofrecía seguro médico?',
        helpText: 'Si es así, puede ser elegible para la cobertura de continuación COBRA.',
      },
      receivingUnemploymentBenefits: {
        label: '¿Recibe actualmente beneficios de desempleo?',
        helpText: 'Los ingresos por desempleo cuentan para los cálculos de subsidios ACA.',
      },
      onCOBRA: {
        label: '¿Está actualmente en la cobertura de continuación COBRA?',
      },
      cobraMonthsRemaining: {
        label: '¿Cuántos meses de COBRA le quedan?',
        placeholder: 'p. ej. 14',
        helpText: 'COBRA dura hasta 18 meses. Saber cuándo termina nos ayuda a planificar su transición.',
      },
      retiredWithBenefits: {
        label: '¿Recibe beneficios de salud de jubilado(a) de un empleador anterior?',
      },
    },
  },

  student_details: {
    title: 'Cuéntenos sobre su escuela',
    subtitle:
      'La inscripción universitaria determina si un plan de salud escolar es una opción — y cuándo inscribirse.',
    fields: {
      isStudent: {
        label: '¿Está inscrito(a) actualmente en una universidad o college en los EE. UU.?',
        helpText: 'La inscripción le da acceso a un Plan de Seguro Médico Estudiantil (SHIP).',
      },
      university: {
        label: '¿En qué escuela estudia?',
        placeholder: 'p. ej. Universidad de Michigan, NYU, Stanford',
        helpText:
          'Lo usaremos para consultar los plazos de inscripción y los requisitos de exención de su escuela.',
      },
      schoolRequiresInsurance: {
        label: '¿Su escuela exige seguro médico?',
        helpText:
          'La mayoría de las escuelas lo exigen para estudiantes internacionales. Consulte su portal estudiantil o su Oficial de Estudiantes Designado (DSO).',
      },
      yearsLeftInCollege: {
        label: '¿Cuántos años le quedan en su programa?',
        options: {
          less_than_1: { label: 'Menos de 1 año', description: 'Se gradúa este año académico' },
          '1_to_2': { label: '1–2 años', description: 'Estudiante de últimos años o maestría' },
          '2_to_4': { label: '2–4 años', description: 'A mitad del pregrado o doctorado' },
          '4_plus': { label: '4 años o más', description: 'Recién comenzó o programa doctoral largo' },
        },
      },
    },
  },

  household: {
    title: 'Su hogar y finanzas',
    subtitle:
      'El tamaño del hogar y los ingresos determinan la elegibilidad para subsidios, Medicaid y reducciones en los costos compartidos.',
    fields: {
      age: {
        label: 'Su edad',
        placeholder: 'p. ej. 28',
        helpText: 'Se usa para verificar elegibilidad de Medicare (65+) y reglas de cobertura como dependiente.',
      },
      householdSize: {
        label: 'Tamaño del hogar',
        placeholder: 'p. ej. 2',
        helpText:
          'Cuente a todos los que viven con usted y dependen de sus ingresos — usted, su cónyuge e hijos. No es necesario haber presentado impuestos juntos en los EE. UU.',
      },
      annualIncome: {
        label: 'Ingresos anuales estimados del hogar (USD)',
        placeholder: 'p. ej. 45000',
        helpText:
          'Use su mejor estimado antes de impuestos. Incluya salarios, estipendios, asistencias de investigación/enseñanza, ingresos de freelance e ingresos en efectivo. Si es estudiante con estipendio, inclúyalo aquí. No se guarda ni se comparte.',
      },
      filingStatus: {
        label: 'Estado de declaración de impuestos',
        helpText: 'Se usa para estimar con más precisión la elegibilidad para el Crédito Fiscal de Prima ACA.',
        options: {
          single: { label: 'Soltero(a)' },
          married_joint: { label: 'Casado(a), declaración conjunta' },
          married_separate: { label: 'Casado(a), declaración separada' },
          head_of_household: { label: 'Jefe de hogar' },
          not_applicable: { label: 'No declaro impuestos en los EE. UU.', description: 'No declarante o no obligado a declarar' },
        },
      },
      hasDependents: {
        label: '¿Tiene dependientes (hijos u otras personas a su cargo)?',
        helpText: 'Esto afecta la elegibilidad de CHIP y los cálculos del tamaño del hogar.',
      },
    },
  },

  health_usage: {
    title: 'Sus necesidades de salud y cobertura',
    subtitle:
      'Estas preguntas nos permiten estimar sus costos anuales reales según el tipo de plan — no solo la prima.',
    fields: {
      expectedHealthcareUsage: {
        label: '¿Cómo describiría sus necesidades de atención médica este año?',
        options: {
          minimal: { label: 'Mínimas — generalmente sano(a)', description: 'Chequeos anuales, rara vez necesita atención' },
          moderate: { label: 'Moderadas — visitas ocasionales', description: 'Algunas visitas al médico o recetas al año' },
          high: {
            label: 'Altas — atención frecuente o continua',
            description: 'Condiciones crónicas, recetas regulares o procedimientos planificados',
          },
        },
      },
      takesRegularMedications: {
        label: '¿Toma medicamentos recetados regularmente?',
        helpText:
          'Los formularios (listas de medicamentos cubiertos) varían mucho entre planes. Esto afecta qué nivel de cobertura de medicamentos importa más.',
      },
      numberOfPrescriptions: {
        label: '¿Aproximadamente cuántos medicamentos recetados diferentes toma?',
        placeholder: 'p. ej. 2',
        helpText: 'Incluso un número aproximado ayuda a estimar los costos del formulario.',
      },
      hasChronicConditions: {
        label: '¿Tiene alguna condición de salud crónica o continua?',
        helpText:
          'p. ej. diabetes, asma, hipertensión, condiciones de salud mental. Los planes ACA no pueden negar cobertura por condiciones preexistentes.',
      },
      chronicConditionList: {
        label: '¿Cuáles condiciones? (opcional — ayuda con la selección de planes)',
        placeholder: 'p. ej. Diabetes tipo 2, asma',
        helpText: 'Solo se usa para mejorar sus recomendaciones de plan. No se guarda.',
      },
      expectedProcedures: {
        label: '¿Tiene procedimientos o visitas a especialistas planificados en los próximos 12 meses?',
        placeholder: 'p. ej. cirugía de rodilla, dermatólogo, terapia',
        helpText: 'Nos ayuda a estimar con más precisión los costos de bolsillo según el nivel del plan.',
      },
      preferredDoctors: {
        label: '¿Tiene un médico o especialista de preferencia que desea conservar?',
        placeholder: 'p. ej. Dr. García en Hospital Universitario',
        helpText: 'Indicaremos si su médico podría estar fuera de la red en ciertos tipos de planes.',
      },
      monthlyPremiumBudget: {
        label: '¿Cuál es su presupuesto mensual máximo para primas? (USD)',
        placeholder: 'p. ej. 200',
        helpText: 'Filtraremos y clasificaremos los planes para mostrar opciones dentro de su presupuesto.',
      },
    },
  },

  benefit_priorities: {
    title: '¿Qué beneficios son más importantes para usted?',
    subtitle:
      'Seleccione todo lo que aplique. Usaremos esto para calificar y clasificar planes según lo que realmente le importa.',
    fields: {
      benefitPriorities: {
        label: 'Seleccione todo lo que sea importante para usted',
        helpText: 'No todos los planes cubren esto — sus selecciones nos ayudan a filtrar y calificar planes.',
        options: {
          prescriptions: { label: '💊 Medicamentos recetados', description: 'Buena cobertura de formulario para medicamentos' },
          mental_health: { label: '🧠 Salud mental', description: 'Terapia, psiquiatría, consejería' },
          dental: { label: '🦷 Cobertura dental', description: 'Limpiezas, empastes, trabajos dentales mayores' },
          vision: { label: '👁️ Cobertura de visión', description: 'Exámenes de la vista, lentes, lentes de contacto' },
          hearing: { label: '👂 Cobertura auditiva', description: 'Pruebas de audición y audífonos' },
          maternity: {
            label: '🤱 Maternidad / recién nacido',
            description: 'Atención prenatal, parto, alumbramiento y cuidado del recién nacido',
          },
          specialist_access: { label: '🏥 Acceso a especialistas', description: 'Sin necesidad de referidos, amplia red PPO' },
          emergency_care: {
            label: '🚑 Atención de emergencia',
            description: 'Buena cobertura de sala de emergencias y atención urgente',
          },
          fitness: { label: '🏋️ Fitness / gimnasio', description: 'Membresía de gimnasio o reembolso de actividad física' },
          transportation: { label: '🚗 Transporte', description: 'Traslados a citas médicas' },
          over_the_counter: { label: '🛒 Artículos de venta libre', description: 'Medicamentos y suministros OTC cubiertos' },
        },
      },
      hospitalVisitFrequency: {
        label: '¿Con qué frecuencia suele visitar un hospital o sala de emergencias?',
        helpText: 'Nos ayuda a priorizar planes con mejor cobertura hospitalaria / de emergencias si la necesita.',
        options: {
          never: { label: 'Nunca o casi nunca', description: 'Evito los hospitales a menos que sea absolutamente necesario' },
          '1_to_2_per_year': { label: '1–2 veces al año', description: 'Visita ocasional a urgencias u hospitalización' },
          monthly: { label: 'Mensualmente', description: 'Citas hospitalarias regulares o tratamientos' },
          regularly: { label: 'Regularmente / de forma continua', description: 'Atención hospitalaria o especializada frecuente' },
        },
      },
      specificHealthConcerns: {
        label: '¿Hay áreas de salud específicas que desea que estén bien cubiertas? (opcional)',
        helpText: 'Seleccione todo lo que aplique — indicaremos cómo maneja cada plan estos aspectos.',
        options: {
          diabetes: { label: 'Control de diabetes' },
          heart: { label: 'Cardiovascular / corazón' },
          cancer: { label: 'Tratamiento del cáncer / oncología' },
          asthma_copd: { label: 'Asma / EPOC' },
          orthopedic: { label: 'Ortopedia / articulaciones / espalda' },
          pregnancy: { label: 'Embarazo / salud reproductiva' },
          pediatric: { label: 'Pediatría / salud infantil' },
          substance_use: { label: 'Tratamiento de uso de sustancias' },
          rare_disease: { label: 'Condición rara o compleja' },
        },
      },
    },
  },

  current_coverage: {
    title: 'Estado de cobertura actual',
    subtitle: 'Algunas preguntas finales sobre su situación de seguro actual.',
    fields: {
      currentlyInsured: {
        label: '¿Tiene seguro médico actualmente?',
      },
      currentPlanType: {
        label: '¿Qué tipo de plan tiene?',
        options: {
          parent_employer: {
            label: 'Plan del empleador de un padre',
            description: 'Cubierto(a) como dependiente en el seguro de trabajo de un padre',
          },
          spouse_employer: {
            label: 'Plan del cónyuge o pareja',
            description: 'Cubierto(a) como dependiente en el seguro del cónyuge o pareja',
          },
          employer: {
            label: 'Mi propio plan del empleador',
            description: 'Inscrito(a) en mi propia cobertura del empleador',
          },
          aca_marketplace: { label: 'Plan del mercado ACA' },
          medicaid: { label: 'Medicaid' },
          medicare: { label: 'Medicare' },
          school_plan: { label: 'Plan de la universidad' },
          isp: { label: 'Plan para estudiantes internacionales (ISP)' },
          cobra: { label: 'COBRA' },
          short_term: { label: 'Plan de corto plazo' },
          other: { label: 'Otro' },
        },
      },
      parentPlanInsurer: {
        label: '¿Qué compañía de seguros administra el plan?',
        placeholder: 'p. ej. Aetna, Blue Cross Blue Shield, UnitedHealth, Cigna',
        helpText: 'Revise el frente de la tarjeta de seguro.',
      },
      parentPlanType: {
        label: '¿Qué tipo de plan es?',
        options: {
          ppo: { label: 'PPO', description: 'Puede ver a la mayoría de los médicos sin referido' },
          hmo: { label: 'HMO', description: 'Debe usar médicos de la red, necesita referidos' },
          hdhp: { label: 'HDHP (Alta deducible)', description: 'Prima más baja, deducible más alto' },
          epo: { label: 'EPO', description: 'Solo red, pero sin necesidad de referidos' },
          unknown: { label: 'No sé' },
        },
      },
      parentPlanPremiumContribution: {
        label: '¿Cuánto paga por este plan cada mes?',
        helpText: 'Muchos padres cubren a los dependientes sin costo adicional para el dependiente.',
        options: {
          '0': { label: '$0 — completamente cubierto por el empleador del padre' },
          under_100: { label: 'Menos de $100/mes' },
          '100_to_300': { label: '$100–$300/mes' },
          over_300: { label: 'Más de $300/mes' },
          unknown: { label: 'No sé' },
        },
      },
      parentPlanSatisfied: {
        label: '¿Está satisfecho(a) con esta cobertura?',
        options: {
          very_happy: {
            label: 'Sí — buena cobertura, sin problemas',
            description: 'Mis médicos están cubiertos y los costos son razonables',
          },
          somewhat_happy: {
            label: 'Más o menos — faltan algunas cosas',
            description: 'Algunas brechas o problemas fuera de red',
          },
          unhappy: {
            label: 'No — busco algo mejor',
            description: 'Brechas en cobertura, costos altos o voy a perder este plan pronto',
          },
        },
      },
      agingOffDate: {
        label: '¿Sabe cuándo deja de ser dependiente en este plan?',
        helpText:
          'Según las reglas ACA, puede permanecer en el plan de un padre hasta los 26 años, independientemente de si es estudiante o está casado(a).',
        options: {
          over_2_years: { label: 'Más de 2 años' },
          '1_to_2_years': { label: '1–2 años' },
          under_1_year: { label: 'Menos de 1 año — necesita planificar la transición pronto' },
          already_aged_off: { label: 'Ya dejé de ser dependiente o estoy por hacerlo' },
          unknown: { label: 'No sé' },
        },
      },
    },
  },
}

// Static UI strings used in the onboarding page
export const ES_UI = {
  stepOf: (current: number, total: number) => `Paso ${current} de ${total}`,
  back: 'Atrás',
  continue: 'Continuar',
  seeMyOptions: 'Ver mis opciones',
  analyzing: 'Analizando su perfil…',
  optional: '(opcional)',
  yes: 'Sí',
  no: 'No',
  selectState: 'Seleccione su estado…',
} as const

// Static strings used on the dashboard home page
export const ES_DASHBOARD = {
  bestOption: 'Mejor opción para su situación',
  explorePlans: 'Explorar planes',
  askAI: 'Preguntar a IA',
  uploadDocs: 'Subir documentos',
  yourChecklist: 'Su lista de acciones',
  generatingChecklist: 'Generando su lista personalizada…',
  plansQualify: (count: number) => `Planes para los que califica (${count})`,
  recommended: 'Recomendado',
  importantNotes: 'Notas importantes',
  nextSteps: 'Próximos pasos',
  fromDocuments: (count: number) => `De sus documentos (${count})`,
  howDecided: '¿Cómo se decidió esto?',
  seeRules: 'Ver las reglas detrás de su elegibilidad',
  enrollmentCalendar: 'Calendario de inscripción',
  keyDates: 'Fechas y plazos clave',
  plansNotQualify: 'Planes para los que no califica',
  expandWhy: 'Amplíe "¿Por qué esta ruta?" para ver los fundamentos legales de cada decisión.',
  deadline: 'Plazo',
  plans: 'Planes y Costos',
  tools: 'Herramientas',
  help: 'Ayuda',
  trustBanner:
    'Solo para uso informativo — no es asesoramiento legal ni de seguros. Las reglas se basan en las pautas actuales de elegibilidad de la ACA y del gobierno federal.',
  verifyLabel: 'Verificar en healthcare.gov →',
} as const
