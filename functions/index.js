const functions = require('firebase-functions')
const admin = require('firebase-admin')
const cors = require('cors')({ origin: true })
const sgMail = require('@sendgrid/mail')

admin.initializeApp()
sgMail.setApiKey(functions.config().sendgrid.key) // set with: firebase functions:config:set sendgrid.key=YOUR_KEY

// Callable: welcome email
exports.sendWelcomeEmail = functions.https.onCall(async (data, context) => {
  await sgMail.send({
    to: data.email,
    from: 'noreply@youthapp.com',
    subject: 'Welcome!',
    text: 'Thanks for registering.'
  })
  return { status: 'sent' }
})

// Public REST API: expose two routes
exports.api = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method === 'GET' && req.path === '/reviews') {
      // Demo static payload
      return res.json([{ title: 'Great', rating: 5 }])
    }
    if (req.method === 'GET' && req.path === '/users/count') {
      // Demo count from local mapping isn’t accessible server-side in coursework;
      // return mock:
      return res.json({ users: 42 })
    }
    return res.status(404).json({ error: 'Not found' })
  })
})
