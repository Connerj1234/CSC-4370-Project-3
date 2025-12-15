## 🛠 Development Journal (Code Authenticity)

This development journal documents the problem-solving process behind the Santa’s Workshop Fifteen Puzzle project. It highlights design decisions, failed approaches, implementation challenges, and how those challenges were resolved. The goal of this section is to demonstrate original critical thinking and hands-on development, rather than just final outcomes.

---

### Authentication and User Accounts

One of the most challenging parts of the project was implementing user authentication using PHP and MySQL. This required coordinating **client-side state, server-side sessions, and database persistence**, all while maintaining security and correct user isolation.

#### Initial Challenge
At first, authentication logic was mixed directly into individual PHP files, which caused issues with inconsistent session handling. Some pages would assume a user was logged in while others did not, leading to unpredictable behavior such as progress not saving or sessions failing to end correctly.

#### Failed Approach
Our first approach relied heavily on client-side checks using JavaScript to determine whether a user was logged in. While this worked visually, it became clear that it was insecure and unreliable, since a user could manipulate client-side state without being authenticated on the server.

#### Final Solution
We centralized authentication logic on the server by introducing a shared `require_login()` function in the backend. This ensured:
- All protected endpoints validate the user session server-side
- Game sessions and progress updates cannot occur without authentication
- Client requests are treated as untrusted until verified by PHP

Passwords are securely stored using hashing, and login verification uses PHP’s built-in password functions. This separation of responsibilities between frontend UI and backend validation significantly improved reliability and security.

---

### Client-Server Synchronization Challenges

Another major challenge was keeping **client-side gameplay state synchronized with server-side session data**.

#### Problem
Game state such as moves, timer values, power-up usage, and puzzle layout updates continuously during gameplay. Sending updates on every move caused unnecessary server load, while sending too few updates risked losing progress if the user refreshed or closed the page.

#### Solution
We implemented a throttled update strategy:
- A game session is created only when the user clicks **Shuffle**
- Updates are periodically sent to the server rather than on every move
- Final session data is committed only once when the game ends

This approach balanced performance with reliability and ensured accurate session tracking without overwhelming the server.

---

### Timer and Game Lifecycle Logic

Handling the game timer correctly was more complex than expected.

#### Initial Issue
Early versions of the timer started immediately when the page loaded. This violated project requirements and caused confusing behavior when users had not yet begun a game.

#### Fix
We redefined **Shuffle** as the official game start action:
- Timer starts only after Shuffle
- Reset stops the timer and clears the session
- Timer automatically stops on win

This required refactoring both the JavaScript timer logic and the server-side session lifecycle to ensure consistency.

---

### Achievement Awarding and Fairness

Achievements needed to be awarded in a way that could not be manipulated by the client.

#### Early Risk
Initially, achievement checks were done on the client side, which made it possible to trigger achievements without actually completing a puzzle legitimately.

#### Final Approach
Achievement evaluation and awarding were moved entirely to the server:
- Achievements are checked in `end_session.php`
- Logic runs inside a database transaction
- Uniqueness constraints prevent duplicate awards

This guaranteed that all rewards reflect genuine gameplay.

---

### Story Progression Logic

Implementing story progression introduced another challenge: ensuring that story stages advanced **only through legitimate puzzle completions**.

#### Resolution
Story progress is updated only when a session ends successfully. Guest users cannot advance story progress, and logged-in users see their story stage persist across sessions. This design tightly couples narrative progression with verified gameplay results.

---

### Debugging and Deployment Challenges

Working on the school server introduced additional constraints:
- Limited access to server logs
- Strict directory and permission rules
- Differences between local and server PHP configurations

We relied heavily on careful error handling, temporary debug output, and controlled logging to isolate issues without exposing sensitive information.

---

### Reflection

This project required us to think beyond individual features and focus on **system-level design**, especially when dealing with authentication, persistence, and fairness. Many features required multiple iterations before they worked reliably. The final architecture reflects lessons learned from early failures and emphasizes secure, maintainable, and user-focused development.

This development journal demonstrates that the project was built through active problem solving, experimentation, and refinement rather than simply assembling pre-written components.
