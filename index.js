import express from 'express';
import bodyParser from 'body-parser';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './src/swagger.js';
import tasksRouter from './src/routes/tasks.js';
import authRouter from './src/routes/auth.js';
import supabase from './src/db/supabase.js';
import initDB from './src/db/init.js';

const app = express();
const PORT = 3000;

// try {
//   await initDB();
// } catch (error) {
//   console.error('Failed to initialize database:', error.message);
//   process.exit(1);
// }

try {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  } 
  console.log('Supabase session retrieved successfully:', data);
}
  catch (error) {
    console.error('Error during Supabase session retrieval:', error.message);
    process.exit(1);
}

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec)); // Serve Swagger UI at /api-docs

app.use(bodyParser.json()); // Middleware to parse JSON request bodies

app.get('/', (req, res) => {
  res.send({
    name: "Task API", 
    version: "1.0", 
    endpoints: ["/tasks"]
  });
}); // Root route to test the server

app.get('/public/info', (req, res) => {
  res.send({
    "message": "Welcome stranger! This info is public."
  }); 
});

app.get('/protected/info', async (req, res) => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      throw error;
    }

    res.send({
      "message": "Welcome back! This info is private.",
      "user": session.user
    });
  } catch (error) {
    console.error('Error during private info retrieval:', error.message);
    res.status(401).json({ error: 'Unauthorized' });
  }
});

app.get('/health', (req, res) => {
  res.status(200).send({ status: 'Server is running and healthy :)' });
}); // Health check route to verify if the server is running

app.use('/auth', authRouter); // Use the auth router file for routes starting with /auth

app.use('/tasks', tasksRouter); // Use the tasks router file  for routes starting with /tasks

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}); // Start the server and listen on the specified port
