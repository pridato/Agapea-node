// para inicializar firebase: 
// fichero configuración https://firebase.google.com/docs/web/setup?authuser=0&hl=es#add-sdks-initialize
const {initializeApp} = require('firebase/app')
const FIREBASE_CONFIG = JSON.parse(process.env.FIREBASE_CONFIG);

const app = initializeApp(FIREBASE_CONFIG);


//---------------- CONFIGURACION ACCESO: FIREBASE-AUTHENTICATION ----------

const { getAuth,GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, signInWithPopup, applyActionCode, checkActionCode } = require('firebase/auth')

const auth = getAuth(app); // <-- servicio acceso a firebase-authentication

const provider = new GoogleAuthProvider(); // <-- servicio acceso google provider

// --------------- CONFIGURACION ACCESO: FIREBASE-DATABASE ----------------

const { query, collection, where, getDocs, addDoc, getFirestore, updateDoc } = require('firebase/firestore');

const db = getFirestore(app) // servicio acceso a todas las colecciones de la DB definida en firebase-database


module.exports = {
  login: async (req, res, next) => {
    console.log('datos mandados oir servicio de angular... ', req.body)
    // 1º inicio de sesion en FIREBASE con email y password:
    // https://firebase.google.com/docs/auth/web/password-auth?authuser=0&hl=es#sign_in_a_user_with_an_email_address_and_password

    try {
      let _userCredentials = await signInWithEmailAndPassword(auth, req.body.email, req.body.password)
      //console.log('Resultado del login por parte de firebase... ', _userCredentials)
      console.log(_userCredentials.emailVerified);
      // 2º recuperar de la bd de firebase-firestore de la coleccion clientes los datos del cliente asociado al mail
      // y almacenar jwt q firebase a originado x nosotros
      // https://firebase.google.com/docs/firestore/query-data/get-data?hl=es&authuser=0#get_multiple_documents_from_a_collection

      let _clienteSnapShot = await getDocs(query(collection(db, 'clientes'), where('cuenta.email', '==', req.body.email)))
      console.log('snapshot recuperado de cliente...', _clienteSnapShot)

      let _datoscliente = _clienteSnapShot.docs.shift().data();
      console.log('datos del cliente recuperados... ', _datoscliente)

      res.status(200).send(
        {
          codigo: 0,
          mensaje: 'login ok...',
          errores: null,
          datoscliente: _datoscliente,
          token: await _userCredentials.user.getIdToken(),
          otrosdatos: {'emailVerificado':_userCredentials.user.emailVerified}
        }
      )


    } catch (error) {
      console.log('Hubo alguna incidencia en la conexión a firebase... ', error)
      res.status(500).send(
        {
          codigo: 1,
          mensaje: 'login fallido',
          errores: error.message,
          token: null,
          datoscliente: null,
          otrosdatos: null
        }
      )
    }

  },
  registro: async (req, res, next) => {
    console.log('registro por angular... ', req.body)

    try {
      let {email, password, ...resto} = req.body;
      // 1º creación de una cuenta FIREBASE dentro de Authentication basada en email y contraseña:
      let _userCredential = await createUserWithEmailAndPassword(auth, email, password)
      console.log('resultado creacion credenciales usuario recien registrado...', _userCredential)

      // 2º mandamos email de activacion de cuenta 
      await sendEmailVerification(_userCredential.user);

      // 3º almacenamos los datos del cliente en coleccion clientes
      let _clienteRef = await addDoc(collection(db, 'clientes'), req.body)
      console.log('referencia al documento insertado en coleccion clientes', _clienteRef)

      res.status(200).send(
        {
          codigo: 0,
          mensaje: 'registro ok...',
          errores: null,
          datoscliente: _userCredential.user ,
          otrosdatos: null,
          token: await _userCredential.user.getIdToken()
        }
      )

    } catch(error){
      console.log('Algo falló en el registro... ',error )
      res.status(500).send(
        {
          codigo: 1,
          mensaje: 'registro fallido...',
          errores: error.mensaje,
          datoscliente: null ,
          otrosdatos: null,
          token: null
        }
      )
    }
  },
  comprobarEmail: async (req, res, next) => {
    try {
      console.log('datos mandados desde la directiva', req.query.email)
      let _email = req.query.email;

      let _resulSnap = await getDocs(query(collection(db, 'clientes'), where('cuenta.email', '==', _email)))
      let _datoscliente = _resulSnap.docs.shift().data;
      console.log('datos del cliente recuperados con email...', _datoscliente)
      if(_datoscliente){
        res.status(200).send(
          {
            codigo: 0,
            mensaje: 'email existente',
            error: null,
            datoscliente: _datoscliente,
            otrosdatos: null,
            token: null
          }
        )
      }else {
        throw new Error('Cliente no localizado')
      }
    } catch(error){
      console.log('error en la comprobacion del email', error)
      res.status(500).send(
        {
          codigo: 1,
          mensaje: 'email inexistente',
          error: error.mensaje,
          datoscliente: null,
          otrosdatos: null,
          token: null
        }
      )
    }
  },
  loginGoogle: async (req, res, next) => {

    try {
    
      res.status(200).send({
        codigo: 0,
        mensaje: 'login ok...',
        errores: null,
        datoscliente: null,
        token: null,
        otrosdatos: {auth, provider}
    })
    } catch (error) {
      const errorMessage = error.message;
  
      res.status(500).send({
        codigo: 1,
        mensaje: 'login fallido...',
        errores: errorMessage,
        datoscliente: null,
        token: null,
        otrosdatos: null
      });
    }
  },
  validarEmail: async (req, res, next) => {
    try {
      const mode = req.query.mode;
      const code = req.query.code
      const apiKey = req.query.apiKey

      console.log(mode, code, apiKey)

      // comprobar k el token se ha enviado pertenece al usuario
      let _actionCodeInfo = await checkActionCode(auth, code);
      console.log('action code en activar cuenta usuario firebase...', _actionCodeInfo)

      switch (_actionCodeInfo.operation) {
        case 'VERIFY_EMAIL':
          
          await applyActionCode(auth, code)
            .then(()=> {
              console.log('email verificado correctamente...')
            })

          break;
      
        default:
          break;
      }

      res.status(200).send({
        codigo:0,
        mensaje:`La operacion (${mode}) sobre la cuenta, se ha realizado correctamente `,
        error: null,
        datoscliente:null,
        token:apiKey,
        otrosdatos:null
    })
    } catch(error){
      res.status(500).send(
        {
          codigo: 1,
          mensaje: 'ERROR',
          errores: error.message,
          datoscliente: null,
          token: null,
          otrosdatos: null
        }
      )
    }
  }
  
} 