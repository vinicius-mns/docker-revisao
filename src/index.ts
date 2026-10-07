import express from "express"

const app = express()
const port = Number(process.env.PORT) || 3000

const helloName = (name: string) => {
  return `ola ${name}, tudo bem?`
} 

app.get("/:name", (req, res) => {
  res.type("text/plain").send(helloName(req.params.name))
})

app.listen(port, () => {
  console.log(`API rodando na porta ${port}`)
})