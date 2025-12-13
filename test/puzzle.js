// ============================================
// COMPLETE CHROME DEVTOOLS BLOCKER
// Blocks ALL shortcuts for Windows, Mac, and Linux
// ============================================

(function() {
    'use strict';

    // Disable right-click (context menu)
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }, false);

    // Block ALL keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        const key = e.key.toUpperCase();
        const keyCode = e.keyCode || e.which;

        // F12 - DevTools
        if (keyCode === 123 || key === 'F12') {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Windows/Linux shortcuts
        if (e.ctrlKey) {
            // Ctrl + Shift + I (Inspect)
            if (e.shiftKey && (keyCode === 73 || key === 'I')) {
                e.preventDefault();
                return false;
            }

            // Ctrl + Shift + J (Console)
            if (e.shiftKey && (keyCode === 74 || key === 'J')) {
                e.preventDefault();
                return false;
            }

            // Ctrl + Shift + C (Inspect Element)
            if (e.shiftKey && (keyCode === 67 || key === 'C')) {
                e.preventDefault();
                return false;
            }

            // Ctrl + U (View Source)
            if (keyCode === 85 || key === 'U') {
                e.preventDefault();
                return false;
            }

            // Ctrl + S (Save Page)
            if (keyCode === 83 || key === 'S') {
                e.preventDefault();
                return false;
            }

            // Ctrl + P (Print/Save as PDF)
            if (keyCode === 80 || key === 'P') {
                e.preventDefault();
                return false;
            }

            // Ctrl + Shift + P (Command Menu)
            if (e.shiftKey && (keyCode === 80 || key === 'P')) {
                e.preventDefault();
                return false;
            }

            // Ctrl + Shift + Delete (Clear Browsing Data)
            if (e.shiftKey && (keyCode === 46 || key === 'DELETE')) {
                e.preventDefault();
                return false;
            }

            // Ctrl + Shift + M (Device Mode)
            if (e.shiftKey && (keyCode === 77 || key === 'M')) {
                e.preventDefault();
                return false;
            }

            // Ctrl + Shift + D (Device Toolbar)
            if (e.shiftKey && (keyCode === 68 || key === 'D')) {
                e.preventDefault();
                return false;
            }

            // Ctrl + F (Find in DevTools)
            if (keyCode === 70 || key === 'F') {
                e.preventDefault();
                return false;
            }

            // Ctrl + Shift + F (Search all files)
            if (e.shiftKey && (keyCode === 70 || key === 'F')) {
                e.preventDefault();
                return false;
            }

            // Ctrl + O (Open file)
            if (keyCode === 79 || key === 'O') {
                e.preventDefault();
                return false;
            }

            // Ctrl + G (Go to line)
            if (keyCode === 71 || key === 'G') {
                e.preventDefault();
                return false;
            }
        }

        // Mac shortcuts (Cmd key)
        if (e.metaKey) {
            // Cmd + Option + I (Inspect)
            if (e.altKey && (keyCode === 73 || key === 'I')) {
                e.preventDefault();
                return false;
            }

            // Cmd + Option + J (Console)
            if (e.altKey && (keyCode === 74 || key === 'J')) {
                e.preventDefault();
                return false;
            }

            // Cmd + Option + C (Inspect Element)
            if (e.altKey && (keyCode === 67 || key === 'C')) {
                e.preventDefault();
                return false;
            }

            // Cmd + Option + U (View Source)
            if (e.altKey && (keyCode === 85 || key === 'U')) {
                e.preventDefault();
                return false;
            }

            // Cmd + S (Save Page)
            if (keyCode === 83 || key === 'S') {
                e.preventDefault();
                return false;
            }

            // Cmd + P (Print)
            if (keyCode === 80 || key === 'P') {
                e.preventDefault();
                return false;
            }

            // Cmd + Shift + P (Command Menu)
            if (e.shiftKey && (keyCode === 80 || key === 'P')) {
                e.preventDefault();
                return false;
            }

            // Cmd + Shift + Delete (Clear Browsing Data)
            if (e.shiftKey && (keyCode === 46 || key === 'DELETE')) {
                e.preventDefault();
                return false;
            }

            // Cmd + Option + F (Search all files)
            if (e.altKey && (keyCode === 70 || key === 'F')) {
                e.preventDefault();
                return false;
            }
        }

        // ESC key (closes DevTools drawer)
        if (keyCode === 27 || key === 'ESCAPE') {
            // Allow ESC for modal dialogs but try to detect DevTools usage
            // This is less aggressive - comment out if causing issues
            // e.preventDefault();
            // return false;
        }

    }, false);

    // Continuous debugger to detect DevTools
    let debuggerActive = false;
    setInterval(function() {
        const start = performance.now();
        debugger;
        const end = performance.now();

        // If debugger statement takes long, DevTools is likely open
        if (end - start > 100) {
            if (!debuggerActive) {
                debuggerActive = true;
                handleDevToolsDetected();
            }
        }
    }, 100);

    // Detect DevTools by window size differences
    let devtoolsOpen = false;
    const threshold = 160; // Pixel threshold

    setInterval(function() {
        const widthDiff = window.outerWidth - window.innerWidth;
        const heightDiff = window.outerHeight - window.innerHeight;

        if (widthDiff > threshold || heightDiff > threshold) {
            if (!devtoolsOpen) {
                devtoolsOpen = true;
                handleDevToolsDetected();
            }
        } else {
            devtoolsOpen = false;
        }
    }, 500);

    // Console detection trick
    const element = new Image();
    Object.defineProperty(element, 'id', {
        get: function() {
            handleDevToolsDetected();
            throw new Error('DevTools detected');
        }
    });

    setInterval(function() {
        console.log(element);
        console.clear();
    }, 1000);

    // Handle DevTools detection
    function handleDevToolsDetected() {
        // Option 1: Clear the page
        document.body.innerHTML = `
            <div style="
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                background: #f44336;
                color: white;
                font-family: Arial, sans-serif;
                text-align: center;
                flex-direction: column;
            ">
                <h1 style="font-size: 3em; margin: 0;">⚠️ Access Denied</h1>
                <p style="font-size: 1.5em; margin-top: 20px;">Developer Tools Detected</p>
                <p style="font-size: 1.2em; margin-top: 10px;">This page is protected.</p>
                <button onclick="location.reload()" style="
                    margin-top: 30px;
                    padding: 15px 30px;
                    font-size: 1.2em;
                    background: white;
                    color: #f44336;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                ">Reload Page</button>
            </div>
        `;

        // Option 2: Redirect (uncomment to use)
        // window.location.href = 'access-denied.html';

        // Option 3: Just alert (uncomment to use)
        // alert('Developer Tools detected! Access restricted.');
    }

    // Disable text selection
    document.addEventListener('selectstart', function(e) {
        e.preventDefault();
        return false;
    });

    // Disable copy
    document.addEventListener('copy', function(e) {
        e.preventDefault();
        return false;
    });

    // Disable cut
    document.addEventListener('cut', function(e) {
        e.preventDefault();
        return false;
    });

    // Disable paste (optional)
    document.addEventListener('paste', function(e) {
        e.preventDefault();
        return false;
    });

    // Disable drag
    document.addEventListener('dragstart', function(e) {
        e.preventDefault();
        return false;
    });

    // Override console methods
    const noop = function() {};
    const consoleMethods = ['log', 'debug', 'info', 'warn', 'error', 'table', 'trace', 'dir', 'dirxml', 'group', 'groupCollapsed', 'groupEnd', 'clear', 'count', 'assert', 'profile', 'profileEnd'];

    consoleMethods.forEach(method => {
        window.console[method] = noop;
    });

    // Prevent iframe embedding (optional security measure)
    if (window.top !== window.self) {
        window.top.location = window.self.location;
    }

    // Detect Firebug (legacy Firefox extension)
    if (window.Firebug && window.Firebug.chrome && window.Firebug.chrome.isInitialized) {
        handleDevToolsDetected();
    }

    console.log('%c⚠️ WARNING', 'color: red; font-size: 30px; font-weight: bold;');
    console.log('%cThis page is protected. Unauthorized access is prohibited.', 'color: red; font-size: 16px;');

})();

// Protect the script from being removed
Object.freeze(Object.prototype);
Object.freeze(Array.prototype);


// This code has been intentionally obfuscated to prevent direct copying
// Students should implement their own solution based on the requirements
(function(){
    'use strict';

    // Puzzle base class
    class BasePuzzle {
        constructor(config) {
            this.gridId = config.gridId;
            this.timerId = config.timerId;
            this.statusId = config.statusId;
            this.completionId = config.completionId;
            this.grid = [[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,0]];
            this.emptyPos = {r:3,c:3};
            this.moves = 0;
            this.time = 0;
            this.timer = null;
            this.solved = false;

            // Sliding movement variables
            this.isDragging = false;
            this.draggedTile = null;
            this.dragStartPos = null;
            this.dragThreshold = 20; // Minimum drag distance to trigger movement

            this.init();
        }

        init() {
            this.render();
            this.startTimer();
            this.attachEvents();
        }

        render() {
            const g = document.getElementById(this.gridId);
            g.innerHTML = '';
            for(let r=0;r<4;r++){
                for(let c=0;c<4;c++){
                    const v = this.grid[r][c];
                    const t = document.createElement('div');
                    t.className = 'puzzle-tile';
                    t.textContent = v !== 0 ? v : '';
                    t.dataset.r = r;
                    t.dataset.c = c;
                    t.draggable = false; // Disable HTML5 drag and drop

                    if(v === 0) {
                        t.classList.add('empty-tile');
                    } else if(this.canMove(r,c)) {
                        t.classList.add('movable');
                        // Add visual indicator for movable tiles
                        t.style.cursor = 'grab';
                    }
                    g.appendChild(t);
                }
            }
        }

        canMove(r,c) {
            return (Math.abs(r-this.emptyPos.r)===1&&c===this.emptyPos.c)||
                   (Math.abs(c-this.emptyPos.c)===1&&r===this.emptyPos.r);
        }

        move(r,c) {
            if(this.solved) return false;
            if(this.canMove(r,c)) {
                this.grid[this.emptyPos.r][this.emptyPos.c] = this.grid[r][c];
                this.grid[r][c] = 0;
                this.emptyPos = {r,c};
                this.moves++;
                this.updateStatus();
                this.render();
                if(this.checkWin()) this.win();
                return true;
            }
            return false;
        }

        checkWin() {
            let e = 1;
            for(let r=0;r<4;r++){
                for(let c=0;c<4;c++){
                    if(r===3&&c===3) {
                        if(this.grid[r][c]!==0) return false;
                    } else {
                        if(this.grid[r][c]!==e) return false;
                        e++;
                    }
                }
            }
            return true;
        }

        win() {
            this.solved = true;
            clearInterval(this.timer);
            document.getElementById(this.completionId).style.display = 'block';
            this.updateStatus(`Solved in ${this.time}s with ${this.moves} moves!`);
        }

        shuffle() {
            this.solved = false;
            document.getElementById(this.completionId).style.display = 'none';
            this.grid = [[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,0]];
            this.emptyPos = {r:3,c:3};
            const d = [{r:-1,c:0},{r:1,c:0},{r:0,c:-1},{r:0,c:1}];
            for(let i=0;i<1000;i++){
                const v = d.filter(x=>{
                    const nr=this.emptyPos.r+x.r,nc=this.emptyPos.c+x.c;
                    return nr>=0&&nr<4&&nc>=0&&nc<4;
                });
                const rd = v[Math.floor(Math.random()*v.length)];
                const tr = this.emptyPos.r+rd.r,tc=this.emptyPos.c+rd.c;
                this.grid[this.emptyPos.r][this.emptyPos.c] = this.grid[tr][tc];
                this.grid[tr][tc] = 0;
                this.emptyPos = {r:tr,c:tc};
            }
            this.moves = 0;
            this.time = 0;
            document.getElementById(this.timerId).textContent = '0';
            this.startTimer();
            this.render();
            this.updateStatus();
        }

        reset() {
            this.solved = false;
            document.getElementById(this.completionId).style.display = 'none';
            this.grid = [[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,0]];
            this.emptyPos = {r:3,c:3};
            this.moves = 0;
            this.time = 0;
            clearInterval(this.timer);
            document.getElementById(this.timerId).textContent = '0';
            this.startTimer();
            this.render();
            this.updateStatus();
        }

        startTimer() {
            clearInterval(this.timer);
            this.timer = setInterval(()=>{
                if(!this.solved) {
                    this.time++;
                    document.getElementById(this.timerId).textContent = this.time;
                }
            },1000);
        }

        updateStatus(m) {
            const s = document.getElementById(this.statusId);
            s.textContent = m || `Moves: ${this.moves} | Time: ${this.time}s`;
        }

        attachEvents() {
            const g = document.getElementById(this.gridId);

            // Click functionality (existing)
            g.addEventListener('click',(e)=>{
                if(this.isDragging) return; // Prevent click if we're dragging

                if(e.target.classList.contains('puzzle-tile')&&!e.target.classList.contains('empty-tile')){
                    const r=parseInt(e.target.dataset.r),c=parseInt(e.target.dataset.c);
                    this.move(r,c);
                }
            });

            // Touch/mouse events for sliding
            g.addEventListener('mousedown', this.handleDragStart.bind(this));
            g.addEventListener('touchstart', this.handleDragStart.bind(this));

            document.addEventListener('mousemove', this.handleDragMove.bind(this));
            document.addEventListener('touchmove', this.handleDragMove.bind(this));

            document.addEventListener('mouseup', this.handleDragEnd.bind(this));
            document.addEventListener('touchend', this.handleDragEnd.bind(this));
            document.addEventListener('touchcancel', this.handleDragEnd.bind(this));
        }

        // Drag and drop methods
        handleDragStart(e) {
            if (this.solved) return;

            const tile = e.target;
            if (!tile.classList.contains('puzzle-tile') ||
                tile.classList.contains('empty-tile') ||
                !tile.classList.contains('movable')) {
                return;
            }

            // Prevent default to avoid text selection
            e.preventDefault();

            this.isDragging = true;
            this.draggedTile = tile;

            // Store initial position
            const r = parseInt(tile.dataset.r);
            const c = parseInt(tile.dataset.c);
            this.dragStartPos = { r, c, x: this.getEventX(e), y: this.getEventY(e) };

            // Visual feedback
            tile.style.cursor = 'grabbing';
            tile.style.transform = 'scale(0.95)';
            tile.style.zIndex = '10';
            tile.style.transition = 'transform 0.1s';
        }

        handleDragMove(e) {
            if (!this.isDragging || !this.draggedTile) return;

            e.preventDefault();

            const currentX = this.getEventX(e);
            const currentY = this.getEventY(e);

            // Calculate drag distance
            const deltaX = currentX - this.dragStartPos.x;
            const deltaY = currentY - this.dragStartPos.y;

            // Update tile position during drag for visual feedback
            this.draggedTile.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.95)`;

            // Check if we've dragged enough to trigger a move
            if (Math.abs(deltaX) > this.dragThreshold || Math.abs(deltaY) > this.dragThreshold) {
                const direction = this.getDragDirection(deltaX, deltaY);
                this.tryMoveByDirection(this.dragStartPos.r, this.dragStartPos.c, direction);
            }
        }

        handleDragEnd(e) {
            if (!this.isDragging) return;

            // Reset tile appearance
            if (this.draggedTile) {
                this.draggedTile.style.transform = '';
                this.draggedTile.style.cursor = 'grab';
                this.draggedTile.style.zIndex = '';
                this.draggedTile.style.transition = '';
            }

            this.isDragging = false;
            this.draggedTile = null;
            this.dragStartPos = null;
        }

        getEventX(e) {
            return e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        }

        getEventY(e) {
            return e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        }

        getDragDirection(deltaX, deltaY) {
            // Determine primary drag direction
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                return deltaX > 0 ? 'right' : 'left';
            } else {
                return deltaY > 0 ? 'down' : 'up';
            }
        }

        tryMoveByDirection(r, c, direction) {
            let targetR = r, targetC = c;

            switch(direction) {
                case 'left': targetC = c - 1; break;
                case 'right': targetC = c + 1; break;
                case 'up': targetR = r - 1; break;
                case 'down': targetR = r + 1; break;
            }

            // Check if the target position is the empty space
            if (targetR === this.emptyPos.r && targetC === this.emptyPos.c) {
                this.move(r, c);
                this.isDragging = false; // Stop dragging after successful move
            }
        }

        specialAction() {
            // To be implemented by subclasses
        }
    }

    // Theme-specific implementations
    class SantaPuzzle extends BasePuzzle {
        constructor() {
            super({
                gridId: 'santa-grid',
                timerId: 'santa-timer',
                statusId: 'santa-status',
                completionId: 'santa-completion'
            });
            this.magicUses = 3;
        }

        specialAction() {
            if(this.magicUses>0) {
                this.magicUses--;
                this.updateStatus(`Christmas magic used! ${this.magicUses} remaining.`);
            } else {
                this.updateStatus("No magic remaining!");
            }
        }
    }

    class ReindeerPuzzle extends BasePuzzle {
        constructor() {
            super({
                gridId: 'reindeer-grid',
                timerId: 'reindeer-timer',
                statusId: 'reindeer-status',
                completionId: 'reindeer-completion'
            });
        }

        specialAction() {
            this.updateStatus("Ho ho ho! Reindeer sounds activated!");
        }
    }

    class ElfPuzzle extends BasePuzzle {
        constructor() {
            super({
                gridId: 'elf-grid',
                timerId: 'elf-timer',
                statusId: 'elf-status',
                completionId: 'elf-completion'
            });
            this.toysMade = 0;
        }

        specialAction() {
            this.toysMade++;
            this.updateStatus(`Elves made ${this.toysMade} toys!`);
        }
    }

    // Initialize puzzles when page loads
    let santa, reindeer, elf;

    document.addEventListener('DOMContentLoaded',()=>{
        const t = document.querySelectorAll('.tab');
        const c = document.querySelectorAll('.tab-content');

        // Tab functionality
        t.forEach(tab=>{
            tab.addEventListener('click',()=>{
                const id = tab.getAttribute('data-tab');
                t.forEach(x=>x.classList.remove('active'));
                tab.classList.add('active');
                c.forEach(x=>x.classList.remove('active'));
                document.getElementById(id).classList.add('active');

                if(id==='version1'&&!santa) {
                    santa = new SantaPuzzle();
                    document.getElementById('santa-shuffle').addEventListener('click',()=>santa.shuffle());
                    document.getElementById('santa-reset').addEventListener('click',()=>santa.reset());
                    document.getElementById('santa-hint').addEventListener('click',()=>santa.specialAction());
                } else if(id==='version2'&&!reindeer) {
                    reindeer = new ReindeerPuzzle();
                    document.getElementById('reindeer-shuffle').addEventListener('click',()=>reindeer.shuffle());
                    document.getElementById('reindeer-reset').addEventListener('click',()=>reindeer.reset());
                    document.getElementById('reindeer-sound').addEventListener('click',()=>reindeer.specialAction());
                } else if(id==='version3'&&!elf) {
                    elf = new ElfPuzzle();
                    document.getElementById('elf-shuffle').addEventListener('click',()=>elf.shuffle());
                    document.getElementById('elf-reset').addEventListener('click',()=>elf.reset());
                    document.getElementById('elf-bloom').addEventListener('click',()=>elf.specialAction());
                }
            });
        });

        t[0].click();

        // Navigation arrows functionality - FIXED
        const scrollUpBtn = document.getElementById('scrollUp');
        const scrollDownBtn = document.getElementById('scrollDown');

        if (scrollUpBtn && scrollDownBtn) {
            scrollUpBtn.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });

            scrollDownBtn.addEventListener('click', () => {
                window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: 'smooth'
                });
            });
        }

        // Presentation info functionality - ENHANCED
        const presentationInfoBtn = document.getElementById('presentationInfoBtn');
        const presentationInfo = document.getElementById('presentationInfo');
        const closeInfoBtn = document.getElementById('closeInfoBtn');

        if (presentationInfoBtn && presentationInfo && closeInfoBtn) {
            presentationInfoBtn.addEventListener('click', () => {
                presentationInfo.style.display = 'block';
                // Scroll to the presentation info section when opened
                presentationInfo.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });

            closeInfoBtn.addEventListener('click', () => {
                presentationInfo.style.display = 'none';
            });

            // Close when clicking outside the content (optional)
            presentationInfo.addEventListener('click', (e) => {
                if (e.target === presentationInfo) {
                    presentationInfo.style.display = 'none';
                }
            });

            // Close with Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && presentationInfo.style.display === 'block') {
                    presentationInfo.style.display = 'none';
                }
            });
        }
    });
})();
