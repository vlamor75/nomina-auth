/**
 * Configura el esquema para un usuario basado en su email
 * @param {object} pool - El pool de conexión a PostgreSQL
 * @param {string} userEmail - El email del usuario autenticado
 * @param {string} userName - El nombre del usuario (opcional)
 * @param {string} userPhone - El teléfono del usuario (opcional)
 * @returns {Promise<Object>} - Información del esquema configurado
 */
async function setupUserSchema(pool, userEmail, userName = '', userPhone = '') {
  try {
    console.log(`Configurando esquema para usuario: ${userEmail}`);
    
    // 1. Verificar si ya existe una empresa para este email
    const empresaResult = await pool.query(
      'SELECT id, empresa FROM cliente_base.empresa WHERE email = $1',
      [userEmail]
    );
    
    let empresaId;
    let empresaNombre;
    
    if (empresaResult.rows.length === 0) {
      console.log(`No se encontró empresa para ${userEmail}, creando nueva...`);
      
      // Obtener un departamento válido
      const deptResult = await pool.query(
        'SELECT id FROM cliente_base.departamentos ORDER BY id LIMIT 1'
      );
      const deptoId = deptResult.rows[0]?.id || 5; // Usa 5 (Antioquia) como fallback
      
      // Obtener un municipio válido para ese departamento
      const muniResult = await pool.query(
        'SELECT id FROM cliente_base.municipios WHERE departamento = $1 LIMIT 1',
        [deptoId]
      );
      const muniId = muniResult.rows[0]?.id || 1; // Usa un valor predeterminado

      // Usar tipo persona 1 (Natural) como valor predeterminado para tipo_empresa_id
      const tipoEmpresaId = 1; // 1 para Natural, 2 para Jurídica

      console.log(`Usando Departamento ID: ${deptoId}, Municipio ID: ${muniId}, Tipo Empresa ID: ${tipoEmpresaId}`);
      
      // 2. Si no existe, crear una nueva empresa con los datos del usuario
      try {
        const createResult = await pool.query(
          'SELECT cliente_base.crear_empresa($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          [
            userName || 'Empresa de ' + userEmail.split('@')[0], // Usar el nombre o generar uno
            userName || 'Usuario', // Contacto
            userEmail, // Email
            userPhone || '', // Celular
            'Dirección por defecto', // Dirección (campo obligatorio)
            deptoId, // ID departamento obtenido dinámicamente
            muniId, // ID municipio obtenido dinámicamente
            '123456789', // NIT (usando un valor por defecto)
            tipoEmpresaId  // Tipo empresa por defecto (referencia a tipo_persona)
          ]
        );
        
        if (!createResult.rows[0] || !createResult.rows[0].crear_empresa) {
          throw new Error('Error al crear empresa: no se retornó ID');
        }
        
        empresaId = createResult.rows[0].crear_empresa;
        empresaNombre = userName || 'Empresa de ' + userEmail.split('@')[0];
        console.log(`Empresa creada con ID: ${empresaId}`);
      } catch (createError) {
        console.error('Error detallado al crear empresa:', createError);
        throw createError;
      }
    } else {
      empresaId = empresaResult.rows[0].id;
      empresaNombre = empresaResult.rows[0].empresa;
      console.log(`Empresa existente encontrada con ID: ${empresaId}`);
    }
    
    // 3. Verificar que el esquema existe
    const schemaName = `empresa_${empresaId}`;
    
    // Verificar si el esquema ya existe
    const schemaResult = await pool.query(
      "SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1",
      [schemaName]
    );
    
    if (schemaResult.rows.length === 0) {
      console.log(`Esquema ${schemaName} no existe, creando...`);
      // Si no existe el esquema, llamar a la función que lo crea
      await pool.query('SELECT cliente_base.crear_esquema_cliente($1)', [empresaId]);
      console.log(`Esquema ${schemaName} creado correctamente`);
    } else {
      console.log(`Esquema ${schemaName} ya existe`);
    }
    
    return {
      empresaId,
      empresaNombre,
      schemaName
    };
  } catch (error) {
    console.error('Error al configurar esquema para usuario:', error);
    throw error;
  }
}

/**
 * Middleware para usar el esquema del usuario en consultas
 */
const useUserSchema = async (pool, req, res, next) => {
  if (!req.session || !req.session.userInfo || !req.session.userInfo.schemaName) {
    return res.status(401).json({ error: 'No autenticado o esquema no configurado' });
  }


  // En la función setupUserSchema, dentro del bloque if para crear empresa nueva
// Generar un NIT único basado en timestamp + parte del email
const timestamp = new Date().getTime();
const emailPart = userEmail.split('@')[0].substring(0, 5);
const uniqueNIT = `${timestamp}${emailPart}`;

const createResult = await pool.query(
  'SELECT cliente_base.crear_empresa($1, $2, $3, $4, $5, $6, $7, $8, $9)',
  [
    userName || 'Empresa de ' + userEmail.split('@')[0], // Usar el nombre o generar uno
    userName || 'Usuario', // Contacto
    userEmail, // Email
    userPhone || '', // Celular
    'Dirección por defecto', // Dirección (campo obligatorio)
    deptoId, // ID departamento obtenido dinámicamente
    muniId, // ID municipio obtenido dinámicamente
    uniqueNIT, // NIT único
    tipoEmpresaId  // Tipo empresa por defecto
  ]
);


  
  try {
    const schemaName = req.session.userInfo.schemaName;
    
    // Configurar el esquema para esta conexión
    await pool.query(`SET search_path TO ${schemaName}, cliente_base`);
    
    // Continuar con la siguiente función
    next();
  } catch (error) {
    console.error('Error al configurar esquema en consulta:', error);
    res.status(500).json({ error: 'Error al configurar base de datos' });
  }
};

module.exports = {
  setupUserSchema,
  useUserSchema
};