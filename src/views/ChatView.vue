<template>
  <q-page class="q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-md-6">
        <!-- Panel de debug -->
        <q-card class="q-mb-md">
          <q-card-section>
            <div class="text-h6">Debug Info</div>
            <div class="q-gutter-sm">
              <div><strong>Estado:</strong> 
                <q-badge :color="isConnected ? 'positive' : 'negative'">
                  {{ isConnected ? 'Conectado' : 'Desconectado' }}
                </q-badge>
              </div>
              <div><strong>Socket ID:</strong> {{ socketId || 'N/A' }}</div>
              <div><strong>Sala actual:</strong> {{ currentRoom || 'Ninguna' }}</div>
              <div><strong>Usuarios en sala:</strong> {{ usersInRoom.length }}</div>
              <div><strong>Mensajes:</strong> {{ messages.length }}</div>
              <div v-if="error" class="text-negative"><strong>Error:</strong> {{ error }}</div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Panel de sala -->
        <q-card class="q-mb-md">
          <q-card-section>
            <div class="text-h6">Unirse a Sala</div>
            <div class="row q-gutter-sm items-center">
              <q-input v-model="username" label="Tu nombre" dense />
              <q-input v-model="roomId" label="ID de sala" dense />
              <q-btn 
                color="primary" 
                label="Unirse" 
                @click="joinRoom"
                :disable="!isConnected"
              />
              <q-btn 
                color="negative" 
                label="Salir" 
                @click="leaveRoom"
                :disable="!currentRoom"
              />
            </div>
          </q-card-section>
        </q-card>

        <!-- Lista de usuarios -->
        <q-card class="q-mb-md" v-if="currentRoom">
          <q-card-section>
            <div class="text-h6">Usuarios en la sala ({{ usersInRoom.length }})</div>
            <div class="q-gutter-sm">
              <q-badge v-for="user in usersInRoom" :key="user.id" color="secondary">
                {{ user.username }}
              </q-badge>
            </div>
          </q-card-section>
        </q-card>

        <!-- Mensajes -->
        <q-card>
          <q-card-section>
            <div class="text-h6">Chat 
              <q-badge v-if="currentRoom">{{ currentRoom }}</q-badge>
            </div>
            <div class="chat-messages q-mb-md">
              <div 
                v-for="message in messages" 
                :key="message.id"
                class="message q-pa-xs"
                :class="{ 'my-message': message.user === username }"
              >
                <div><strong>{{ message.user }}:</strong> {{ message.text }}</div>
                <small class="text-grey">{{ formatTime(message.timestamp) }}</small>
              </div>
            </div>
            
            <q-input 
              v-model="newMessage"
              label="Escribe tu mensaje"
              @keyup.enter="sendMessage"
              :disable="!currentRoom"
              dense
            >
              <template v-slot:after>
                <q-btn 
                  color="primary" 
                  label="Enviar" 
                  @click="sendMessage"
                  :disable="!currentRoom"
                  dense
                />
              </template>
            </q-input>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useSocket } from '../composables/useSocket';
import type { Message, User } from '../types/socket';

const { 
  isConnected, 
  socketId, 
  error,
  connect, 
  disconnect, 
  emit, 
  on 
} = useSocket();

const username = ref('Usuario' + Math.floor(Math.random() * 1000));
const roomId = ref('sala-principal');
const newMessage = ref('');
const currentRoom = ref('');
const messages = ref<Message[]>([]);
const usersInRoom = ref<User[]>([]);

// Configurar listeners
onMounted(() => {
  console.log('🚀 ChatView montado');
  
  connect('http://localhost:3000', {
    auth: { username: username.value },
    transports: ['websocket', 'polling']
  });
  
  // Escuchar eventos de conexión
  on.connected((data) => {
    console.log('✅ FRONTEND: Conectado al backend:', data);
  });

  // Escuchar cuando el backend confirma que nos unimos a la sala
  on.roomJoined((data) => {
    console.log('🎉 FRONTEND: Unión a sala confirmada por backend:', data);
    // Aquí puedes actualizar el estado con la información de la sala
  });

  // Escuchar cuando un usuario se une
  on.userJoined((data) => {
    console.log('👤 FRONTEND: userJoined event:', data);
    usersInRoom.value.push(data.user);
    
    messages.value.push({
      id: Date.now().toString(),
      text: `${data.user.username} se unió a la sala`,
      user: 'Sistema',
      timestamp: new Date().toISOString(),
      roomId: data.roomId
    });
  });
  
  // Escuchar cuando un usuario sale
  on.userLeft((data) => {
    console.log('👤 FRONTEND: userLeft event:', data);
    usersInRoom.value = usersInRoom.value.filter(user => user.id !== data.user.id);
    
    messages.value.push({
      id: Date.now().toString(),
      text: `${data.user.username} salió de la sala`,
      user: 'Sistema',
      timestamp: new Date().toISOString(),
      roomId: data.roomId
    });
  });
  
  // Escuchar mensajes de la sala
  on.roomMessage((message: Message) => {
    console.log('💬 FRONTEND: roomMessage event:', message);
    messages.value.push(message);
  });

  // Escuchar errores
  on.error((data) => {
    console.error('❌ FRONTEND: Error event:', data);
  });
});

onUnmounted(() => {
  console.log('🔌 ChatView desmontado');
  if (currentRoom.value) {
    leaveRoom();
  }
  disconnect();
});

const joinRoom = () => {
  if (!username.value || !roomId.value) {
    console.error('❌ Faltan datos: username o roomId');
    return;
  }

  if (!isConnected.value) {
    console.error('❌ No hay conexión Socket.io. Conectando primero...');
    connect('http://localhost:3000', {
      auth: { username: username.value },
      transports: ['websocket', 'polling']
    });
    
    // Esperar a que se conecte antes de unirse a la sala
    setTimeout(() => {
      if (isConnected.value) {
        doJoinRoom();
      } else {
        console.error('❌ No se pudo conectar después de 2 segundos');
      }
    }, 2000);
    return;
  }

  doJoinRoom();
};
const doJoinRoom = () => {
  console.log('🚪 FRONTEND: Enviando join:room al backend', {
    roomId: roomId.value,
    username: username.value
  });

  // Verificar que el socket esté realmente conectado
  if (!isConnected.value) {
    console.error('❌ Socket no conectado, no se puede unir a sala');
    return;
  }

  emit.joinRoom(roomId.value, username.value);
  
  // Estado optimista - asumimos que va a funcionar
  currentRoom.value = roomId.value;
  
  console.log('✅ FRONTEND: Evento join:room enviado');
};
const leaveRoom = () => {
  if (currentRoom.value) {
    console.log('🚪 Saliendo de sala:', currentRoom.value);
    emit.leaveRoom(currentRoom.value);
    currentRoom.value = '';
    usersInRoom.value = [];
  }
};

const sendMessage = () => {
  if (!newMessage.value.trim() || !currentRoom.value || !isConnected.value) {
    return;
  }

  console.log('📤 Enviando mensaje:', newMessage.value);
  
  // Agregar mensaje localmente inmediatamente
  const tempMessage: Message = {
    id: 'temp-' + Date.now(),
    text: newMessage.value,
    user: username.value,
    timestamp: new Date().toISOString(),
    roomId: currentRoom.value
  };
  
  messages.value.push(tempMessage);
  emit.sendMessage(currentRoom.value, newMessage.value);
  newMessage.value = '';
};

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString();
};
</script>

<style scoped>
.chat-messages {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 8px;
}

.message {
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 4px;
  padding: 8px;
  border-radius: 4px;
}

.message:last-child {
  border-bottom: none;
}

.my-message {
  background-color: #e3f2fd;
  border-left: 4px solid #2196f3;
}

.message.system {
  background-color: #f5f5f5;
  font-style: italic;
}
</style>