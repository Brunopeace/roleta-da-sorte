if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js')
        .then(reg => console.log('✅ Service Worker registrado!', reg))
        .catch(err => console.log('Erro ao registrar Service Worker', err));
    });
  }












    let deferredPrompt; 

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Exibe o botão de instalaçao
        const installButton = document.getElementById('installButton');
        if (installButton) {
            installButton.style.display = 'block';
        }
    });

    // Ouve o clique no seu botão de instalação
    const installButton = document.getElementById('installButton');
    if (installButton) {
        installButton.addEventListener('click', () => {
            if (deferredPrompt) {
                deferredPrompt.prompt(); // Mostra o prompt de instalação nativo do navegador
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('Usuário aceitou instalar o PWA');
                    } else {
                        console.log('Usuário recusou instalar o PWA');
                    }
                    deferredPrompt = null; // Limpa o evento
                    installButton.style.display = 'none'; // Esconde o botão após a tentativa
                });
            }
        });
    }

    // Ouve quando o app é realmente instalado
    window.addEventListener('appinstalled', () => {
        console.log('PWA instalado com sucesso!');
        const installButton = document.getElementById('installButton');
        if (installButton) {
            installButton.style.display = 'none';
        }
    });

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
    // Adicionado "get" nos imports para permitir a busca e atualização em massa
    import { getDatabase, ref, set, onValue, update, remove, get } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";

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

    // --- VARIÁVEIS GLOBAIS ---
    const canvas = document.getElementById('wheel');
    const ctx = canvas.getContext('2d');
    const btnSpin = document.getElementById('spinBtn');
    const tickSound = new Audio("mp3/roleta.mp3");
    
    let isSpinning = false;
    let clienteAtivo = { nome: "Visitante", giros: 0, telefone: "" };
    let currentRotation = 0;
    let authMode = "login"; 
    let lastPlayedAngle = -1;

    const prizes = [
        { label: "1 MÊS", color: "#2ecc71", weight: 5 },
        { label: "NÃO FOI DESSA VEZ", color: "#222", weight: 95 },
        { label: "1 ANO", color: "#f1c40f", weight: 1 },
        { label: "2 MESES", color: "#3498db", weight: 3 },
        { label: "6 MESES", color: "#e74c3c", weight: 1 },
        { label: "MAIS UMA CHANCE", color: "#9b59b6", weight: 40 },
        { label: "1 MÊS", color: "#1abc9c", weight: 5 },
        { label: "NÃO FOI DESSA VEZ", color: "#222", weight: 95 }
    ];

    const arc = (2 * Math.PI) / prizes.length;
    const degPerSlice = 360 / prizes.length;

    // --- SISTEMA DE LOGIN / CADASTRO / EDIÇÃO ---
    window.toggleAuthMode = function(mode) {
        authMode = mode;
        const btn = document.getElementById('btnAcao');
        const inputNome = document.getElementById('reg-nome');
        const title = document.getElementById('modal-title');
        const desc = document.getElementById('modal-desc');
        const toggleText = document.getElementById('toggle-text');

        if (mode === 'cadastro') {
            title.innerText = "CADASTRE-SE";
            desc.innerText = "Crie sua conta para girar a roleta da sorte";
            inputNome.style.display = "block";
            btn.innerText = "CADASTRAR";
            toggleText.innerHTML = 'Já tem conta? <span onclick="toggleAuthMode(\'login\')" style="color: var(--viva-yellow); cursor: pointer; font-weight: bold;">Entrar</span>';
        } else {
            title.innerText = "LOGIN";
            desc.innerText = "Acesse sua conta para girar a roleta da sorte";
            inputNome.style.display = "none";
            btn.innerText = "ENTRAR";
            toggleText.innerHTML = 'Não tem cadastro? <span onclick="toggleAuthMode(\'cadastro\')" style="color: var(--viva-yellow); cursor: pointer; font-weight: bold;">Cadastre-se</span>';
        }
    };

    window.abrirEdicao = function() {
        if(isSpinning) return;
        authMode = "edicao";
        document.getElementById('modal-title').innerText = "EDITAR DADOS";
        document.getElementById('reg-nome').style.display = "block";
        document.getElementById('reg-nome').value = clienteAtivo.nome;
        document.getElementById('reg-tel').value = clienteAtivo.telefone;
        document.getElementById('btnAcao').innerText = "SALVAR ALTERAÇÕES";
        document.getElementById('btnFecharEdicao').style.display = "block";
        document.getElementById('toggle-text').style.display = "none";
        document.getElementById('registration-overlay').style.display = "flex";
    };

    document.getElementById('btnFecharEdicao').onclick = () => {
        document.getElementById('registration-overlay').style.display = "none";
        document.getElementById('toggle-text').style.display = "block";
    };

    document.getElementById('btnAcao').onclick = function() {
    const nome = document.getElementById('reg-nome').value.trim();
    const rawTel = document.getElementById('reg-tel').value.trim();
    const tel = rawTel.replace(/\D/g,'');
    const checkbox = document.getElementById('remember-me').checked;

    // --- VALIDAÇÃO DE TELEFONE ---
    if (tel.length !== 11) {
        return alert("O telefone deve ter exatamente 11 dígitos (DDD + Número).");
    }
    // Impede números óbvios de teste ou falsos (ex: 00000000000, 11111111111...)
    if (/^(\d)\1+$/.test(tel)) {
        return alert("Por favor, insira um número de telefone válido.");
    }
    // Verifica se o DDD (dois primeiros dígitos) parece real (não começa com 0)
    if (parseInt(tel.substring(0, 2)) < 11) {
        return alert("DDD inválido.");
    }

    if((authMode === 'cadastro' || authMode === 'edicao') && !nome) {
        return alert("Digite seu nome!");
    }

    tickSound.play().then(() => { tickSound.pause(); tickSound.currentTime = 0; }).catch(() => {});

    const telAntigo = clienteAtivo.telefone;
    
    // Se estiver editando e mudar o número, remove o antigo
    if(authMode === 'edicao' && telAntigo && telAntigo !== tel) {
        if(!confirm("Mudar o telefone removerá seus dados vinculados ao número antigo. Confirma?")) return;
        remove(ref(db, 'clientes/' + telAntigo));
    }

    // Acessa o Firebase para verificar se o cliente existe
    onValue(ref(db, 'clientes/' + tel), (snapshot) => {
        let user;
        if(snapshot.exists()) {
            user = snapshot.val();
            // Se for modo login e o usuário existe, apenas prossegue.
            // Se for edição, atualiza o nome.
            if(authMode === 'edicao' || authMode === 'cadastro') {
                update(ref(db, 'clientes/' + tel), { nome: nome });
                
                // Atualiza o nome em todos os prêmios vinculados a este telefone
                get(ref(db, 'premios')).then((prizeSnap) => {
                    if (prizeSnap.exists()) {
                        const premios = prizeSnap.val();
                        Object.keys(premios).forEach(id => {
                            if (premios[id].telefone === tel) {
                                update(ref(db, 'premios/' + id), { nome: nome });
                            }
                        });
                    }
                });
                user.nome = nome;
            }
        } else {
            // Se não existe e tentou login
            if(authMode === 'login') return alert("Telefone não encontrado. Por favor, faça o cadastro!");
            
            // Se for cadastro novo
            user = { 
                nome: nome, 
                telefone: tel, 
                giros: clienteAtivo.giros || 0 
            };
            set(ref(db, 'clientes/' + tel), user);
        }

        if(checkbox) localStorage.setItem('viva_sorte_user', JSON.stringify(user));
        else localStorage.removeItem('viva_sorte_user');

        document.getElementById('registration-overlay').style.display = 'none';
        iniciarApp(tel);
    }, { onlyOnce: true });
};

    function iniciarApp(tel) {
        onValue(ref(db, 'clientes/' + tel), (snapshot) => {
            const data = snapshot.val();
            if(data) {
                clienteAtivo = data;
                atualizarUI();
            } else {
                localStorage.removeItem('viva_sorte_user');
                clienteAtivo = { nome: "Visitante", giros: 0, telefone: "" };
                toggleAuthMode('login');
                document.getElementById('registration-overlay').style.display = 'flex';
                atualizarUI();
            }
        });
    }

    function atualizarUI() {
        document.getElementById('labelNome').innerText = clienteAtivo.nome;
        document.getElementById('labelGiros').innerText = clienteAtivo.giros;
        if (!isSpinning) {
            btnSpin.disabled = (clienteAtivo.giros <= 0);
            btnSpin.innerText = clienteAtivo.giros <= 0 ? "SEM GIROS" : "GIRAR ROLETA";
        }
    }

    // --- DESENHO E ANIMAÇÃO ---
    function draw() {
        const radius = 295;
        prizes.forEach((p, i) => {
            const angle = i * arc;
            ctx.beginPath();
            ctx.fillStyle = p.color;
            ctx.moveTo(300, 300);
            ctx.arc(300, 300, radius, angle, angle + arc);
            ctx.fill();
            ctx.save();
            ctx.translate(300, 300);
            ctx.rotate(angle + arc / 2);
            ctx.fillStyle = "white";
            ctx.font = "bold 20px Arial";
            ctx.textAlign = "right";
            ctx.fillText(p.label, radius - 25, 10);
            ctx.restore();
        });
    }

    function checkTick() {
        if (!isSpinning) return;
        const style = window.getComputedStyle(canvas);
        const matrix = new WebKitCSSMatrix(style.transform);
        const angle = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
        const normalizedAngle = (angle < 0 ? angle + 360 : angle);
        const sliceIndex = Math.floor(normalizedAngle / degPerSlice);
        if (sliceIndex !== lastPlayedAngle) {
            tickSound.pause();
            tickSound.currentTime = 0;
            tickSound.play().catch(() => {});
            lastPlayedAngle = sliceIndex;
        }
        requestAnimationFrame(checkTick);
    }

    function spin() {
        if (clienteAtivo.giros <= 0 || isSpinning) return;
        isSpinning = true;
        btnSpin.disabled = true;
        btnSpin.innerText = "SORTEANDO...";

        update(ref(db, 'clientes/' + clienteAtivo.telefone), {
            giros: clienteAtivo.giros - 1
        });

        const totalWeight = prizes.reduce((acc, p) => acc + p.weight, 0);
        let random = Math.random() * totalWeight;
        let winnerIndex = 0;
        for (let i = 0; i < prizes.length; i++) {
            if (random < prizes[i].weight) { winnerIndex = i; break; }
            random -= prizes[i].weight;
        }

        const targetSliceAngle = (winnerIndex * degPerSlice) + (degPerSlice / 2);
        const finalAngle = 360 - targetSliceAngle - 90; 
        currentRotation += (3600 + finalAngle - (currentRotation % 360));
        canvas.style.transform = `rotate(${currentRotation}deg)`;
        requestAnimationFrame(checkTick);

        setTimeout(() => {
            isSpinning = false;
            lastPlayedAngle = -1;
            const result = prizes[winnerIndex].label;

            if (result === "MAIS UMA CHANCE") {
                update(ref(db, 'clientes/' + clienteAtivo.telefone), { giros: clienteAtivo.giros + 1 });
                alert("🍀 MAIS UMA CHANCE!");
            } else if (result === "NÃO FOI DESSA VEZ") {
                if(clienteAtivo.giros <= 0) document.getElementById('modalEsgotado').style.display = 'flex';
            } else {
                document.getElementById('prizeDisplay').innerText = result;
                document.getElementById('modal').style.display = 'flex';
                confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
                
                // GRAVAÇÃO DO PRÊMIO COM TELEFONE (PARA O ADM E PARA ATUALIZAÇÃO DE NOME)
                set(ref(db, 'premios/' + Date.now()), {
                    nome: clienteAtivo.nome,
                    telefone: clienteAtivo.telefone, 
                    premio: result,
                    hora: new Date().toLocaleTimeString()
                });
            }
            atualizarUI();
        }, 6000);
    }

    btnSpin.addEventListener('click', spin);
    document.getElementById('btnClosePrize').onclick = () => {
        document.getElementById('modal').style.display = 'none';
        if(clienteAtivo.giros <= 0) document.getElementById('modalEsgotado').style.display = 'flex';
    };

    window.onload = () => {
        draw();
        const salvo = localStorage.getItem('viva_sorte_user');
        if(salvo) {
            try {
                const user = JSON.parse(salvo);
                document.getElementById('registration-overlay').style.display = 'none';
                iniciarApp(user.telefone);
            } catch(e) {
                localStorage.removeItem('viva_sorte_user');
                toggleAuthMode('login');
            }
        } else {
            toggleAuthMode('login');
        }
    };