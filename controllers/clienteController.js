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

  },
  registro: async (req, res, next) => {

    console.log('datos enviados del registro... ', req.body)

    try {

      let {cuenta, ...resto} = req.body
      // crear auth con email y password, pasar confirmar al correo y almacenar credenciales...
      let _userCredentials = createUserWithEmailAndPassword(auth, cuenta.email, cuenta.password)
      let result = await _userCredentials
      console.log('resultado creacion credenciales usuario recien registrado...', result)
      await sendEmailVerification(result.user);

      let _clienteRef = await addDoc(collection(db, 'clientes'), req.body)
      console.log('cliente insertado en firebaseeee')

      res.status(200).send(
        {
          codigo: 0,
          mensaje: 'registro ok...',
          errores: null,
          datoscliente: _userCredentials.user ,
          otrosdatos: null,
          token: ''
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
  comprobarEmail: async (req, res, next) => {},
  loginGoogle: async (req, res, next) => {},
  validarEmail: async (req, res, next) => {}
} 