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

const { query, collection, where, getDocs, addDoc, getFirestore, updateDoc, doc } = require('firebase/firestore');

const db = getFirestore(app) // servicio acceso a todas las colecciones de la DB definida en firebase-database


module.exports = {
  login: async (req, res, next) => {

    const {email, password} = req.body
  
    let _userCredentials = await signInWithEmailAndPassword(auth, email, password)

    let emailVerified = _userCredentials.user.emailVerified
    if(emailVerified){
      let _clienteSnapShot = await getDocs(query(collection(db, 'clientes'), where('cuenta.email', '==', req.body.email)))

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
    }else{
      res.status(500).send(
        {
          codigo: 1,
          mensaje: 'cuenta no confirmada...',
          errores: null,
          datoscliente: null,
          token: null,
          otrosdatos: {'emailVerificado':_userCredentials.user.emailVerified}
        }
      )
    }

    

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
          datoscliente: await result.user ,
          otrosdatos: null,
          token: await result.user.getIdToken()
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
  ActivarCuenta: async (req, res, next) => {
    let {mode, code, key} = req.query
    try {
      console.log(req.query)

      let _actionCode = await checkActionCode(auth, code)
      console.log('action code en activar cuenta usuario firebase...', _actionCode)

      // query snapshot query...
      let querySnapshot = await getDocs(query(collection(db, 'clientes'), where('cuenta.email', '==', _actionCode.data.email)))
      console.log('query... ', querySnapshot)

      switch(_actionCode.operation){
        case 'VERIFY_EMAIL':
          let userDocRef = doc(db, 'clientes', querySnapshot.docs[0].id)
          await applyActionCode(auth, code)
          .then(()=> {
            console.log('email verificado correctamente...')
          })
          await updateDoc(userDocRef, {'cuenta.cuentaActiva': true })
          break;
      }
      res.status(200).send(
        {
          codigo: 0,
          mensaje: 'registro ok...',
          errores: null,
          datoscliente: null ,
          otrosdatos: null,
          token: null
        }
      )

    } catch(error){
      console.log(error)
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
  ComprobarEmail: async (req, res, next) => {
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
  loginGoogle: async (req, res, next) => {},
  
} 