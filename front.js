const express = require('express')
const path = require('path')
// const { ArgumentParser } = require('argparse')

// const parser = new ArgumentParser({
//   description: 'Argparser'
// });

// parser.add_argument('-ts', '--turnserver', { help: 'turn server address' });
// parser.add_argument('-u', '--username', {help: 'username for turn server'});
// parser.add_argument('-p', '--password', {help: 'password for turn server'});
// parser.add_argument('-s', '--stunserver', { help: 'stun server address' });

// args = parser.parse_args()

// if(args.turnserver !== undefined) {

// } 

const app = express()

const port = 8000



app.get('/', (req, res) => {
    res.render(path.join(__dirname, 'index.html'))
})

app.listen(port, () => {
    console.log(`start on port: ${port}`)
})