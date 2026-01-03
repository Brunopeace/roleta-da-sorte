import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
    import { getDatabase, ref, onValue, update, remove, set, get } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";

    const firebaseConfig = {
        apiKey: "AIzaSyBia8_g9JaSgK6BP-b45jjVO4jEwxigaRE",
        authDomain: "girodasorte-5cc3e.firebaseapp.com",
        databaseURL: "https://girodasorte-5cc3e-default-rtdb.firebaseio.com",
        projectId: "girodasorte-5cc3e",
        storageBucket: "girodasorte-5cc3e.firebasestorage.app",
        messagingSenderId: "86218753040",
        appId: "1:86218753040:web:e480f341b7378a78517695"
    };

    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);
    let clienteSelecionado = null;

    // --- FUNÇÕES DE EXCLUSÃO ---

    // Exclui o cliente e AUTOMATICAMENTE todos os prêmios dele
    window.excluirCliente = async function(telefone, nome) {
        if(confirm(`Deseja excluir ${nome}? TODOS os prêmios vinculados a este telefone também serão apagados.`)) {
            
            // 1. Remove o registro do cliente
            await remove(ref(db, 'clientes/' + telefone));

            // 2. Busca no nó de prêmios e apaga os que pertencem a este telefone
            const premiosRef = ref(db, 'premios');
            const snapshot = await get(premiosRef);
            
            if (snapshot.exists()) {
                const premios = snapshot.val();
                Object.keys(premios).forEach(id => {
                    if (premios[id].telefone === telefone) {
                        remove(ref(db, 'premios/' + id));
                    }
                });
            }

            // Reseta a seleção se o cliente apagado era o que estava selecionado
            if(clienteSelecionado && clienteSelecionado.telefone === telefone) {
                clienteSelecionado = null;
                document.getElementById('inputName').value = "";
                document.getElementById('btnEnviar').disabled = true;
            }
        }
    };

    // --- ESCUTAR CLIENTES EM TEMPO REAL ---
    onValue(ref(db, 'clientes'), (snapshot) => {
        const listContainer = document.getElementById('userList');
        listContainer.innerHTML = '';
        const clientes = snapshot.val();
        
        if(!clientes) {
            listContainer.innerHTML = '<div style="padding:15px; color:#666; font-size:11px; text-align:center;">Nenhum cliente cadastrado</div>';
            return;
        }

        Object.keys(clientes).forEach(id => {
            const user = clientes[id];
            const div = document.createElement('div');
            div.className = `user-item ${clienteSelecionado?.telefone === user.telefone ? 'selected' : ''}`;
            
            div.innerHTML = `
                <div class="user-info-text" style="flex-grow:1; cursor:pointer;" onclick="selecionarCliente('${user.telefone}')">
                    <b>${user.nome}</b>
                    <span>${user.telefone}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span class="badge-giros">${user.giros}</span>
                    <button onclick="excluirCliente('${user.telefone}', '${user.nome}')" class="btn-excluir">EXCLUIR</button>
                </div>
            `;
            
            window.selecionarCliente = (tel) => {
                clienteSelecionado = clientes[tel];
                document.getElementById('inputName').value = clienteSelecionado.nome;
                document.getElementById('btnEnviar').disabled = false;
                Array.from(document.querySelectorAll('.user-item')).forEach(el => el.classList.remove('selected'));
                div.classList.add('selected');
            };

            listContainer.appendChild(div);
        });
    });
    
    // --- ESCUTAR PRÊMIOS EM TEMPO REAL (SEM BOTÃO DE EXCLUIR) ---
    onValue(ref(db, 'premios'), (snapshot) => {
        const listContainer = document.getElementById('prizesList');
        listContainer.innerHTML = '';
        const premios = snapshot.val();
        
        if(!premios) {
            listContainer.innerHTML = '<div style="padding:10px; color:#666; font-size:10px; text-align:center;">Nenhum prêmio ainda</div>';
            return;
        }

        const keys = Object.keys(premios).reverse();
        keys.forEach(id => {
            const p = premios[id];
            const div = document.createElement('div');
            div.className = 'user-item';
            div.style.borderLeft = "3px solid #2ecc71";
            div.style.padding = "8px 12px";
            
            div.innerHTML = `
                <div class="user-info-text">
                    <b style="color:#fff">${p.nome}</b>
                    <span style="color: #2ecc71">🎁 ${p.premio}</span>
                    <small style="font-size:9px; color: yellow; display:block;">${p.hora}</small>
                </div>
            `;
            listContainer.appendChild(div);
        });
    });

    // --- ENVIAR CRÉDITOS ---
    window.enviarCreditos = function() {
        if(!clienteSelecionado) return;
        const input = document.getElementById('inputGiros');
        const novosGiros = parseInt(input.value);
        
        if(isNaN(novosGiros) || novosGiros < 1) return alert("Digite um número de giros válido");
        
        const userRef = ref(db, 'clientes/' + clienteSelecionado.telefone);
        update(userRef, {
            giros: clienteSelecionado.giros + novosGiros
        }).then(() => {
            document.getElementById('statusMsg').innerText = `✅ +${novosGiros} giros para ${clienteSelecionado.nome}`;
            input.value = ""; 
            setTimeout(() => document.getElementById('statusMsg').innerText = "", 3000);
        });
    };

    // --- LIMPAR DADOS EM MASSA ---
    window.limparPremios = function() {
        if(confirm("Deseja apagar TODO o histórico de prêmios?")) {
            remove(ref(db, 'premios'));
        }
    };

    window.limparTudo = function() {
        if(confirm("CUIDADO! Isso apagará TODOS os clientes e prêmios. Tem certeza?")) {
            remove(ref(db, '/'));
            location.reload();
        }
    };