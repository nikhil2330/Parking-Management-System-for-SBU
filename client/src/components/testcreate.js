import React, { useState } from 'react';
import axios from 'axios';

function CreateUser() {
  const [username, setUsername] = useState('');
  const [responseMessage, setResponseMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/api/users', { username });
      setResponseMessage(response.data.message);
      setUsername(''); 
    } catch (error) {
      setResponseMessage('Error creating user');
      console.error(error);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Create User</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button 
          type="submit"
        >
          Create User
        </button>
      </form>
      {responseMessage && <p>{responseMessage}</p>}
    </div>
  );
}

export default CreateUser;