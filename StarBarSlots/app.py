from flask import Flask, render_template
from flask_socketio import SocketIO
import random, time, threading
app = Flask(__name__)
app.config['SECRET_KEY'] = 'starbar-secret'
socketio = SocketIO(app, cors_allowed_origins="*")
SYMBOLS = ["🍒","🍋","🍉","⭐","🔔","💎","7️⃣"]
REEL_COUNT = 3
SPIN_DURATION = 2.0
SPIN_SPEED = 0.05
START_BALANCE = 100
BET_AMOUNT = 10
JACKPOT_WIN = 100
DOUBLE_WIN = 25
BUY_AMOUNT = 50
player_balance = START_BALANCE
@app.route('/')
def index():
    return render_template('index.html', reels=REEL_COUNT, balance=player_balance, bet=BET_AMOUNT, title="Star Bar Slots")
def emit_update(reel, symbol):
    socketio.emit('update_reel', {'reel': reel, 'symbol': symbol})
@socketio.on('spin')
def spin():
    global player_balance
    if player_balance < BET_AMOUNT:
        socketio.emit('result', {'message': "💀 Out of coins!", 'color': 'gray'})
        socketio.emit('show_buy_button', {'show': True})
        return
    player_balance -= BET_AMOUNT
    socketio.emit('balance_update', {'balance': player_balance})
    socketio.emit('show_buy_button', {'show': False})
    def spin_thread():
        global player_balance
        results = []
        for i in range(REEL_COUNT):
            start = time.time()
            while time.time() - start < SPIN_DURATION:
                emit_update(i, random.choice(SYMBOLS))
                time.sleep(SPIN_SPEED)
            final = random.choice(SYMBOLS)
            emit_update(i, final)
            results.append(final)
        if all(s == results[0] for s in results):
            message = f"🎉 JACKPOT! +${JACKPOT_WIN} 🎉"
            color = "gold"
            player_balance += JACKPOT_WIN
        elif len(set(results)) == 2:
            message = f"✨ Two Match! +${DOUBLE_WIN} ✨"
            color = "orange"
            player_balance += DOUBLE_WIN
        else:
            message = "❌ Try Again ❌"
            color = "red"
        socketio.emit('result', {'message': message, 'color': color})
        socketio.emit('balance_update', {'balance': player_balance})
        if player_balance <= 0:
            socketio.emit('show_buy_button', {'show': True})
    threading.Thread(target=spin_thread).start()
@socketio.on('preview_spin')
def preview_spin():
    def preview_thread():
        for i in range(REEL_COUNT):
            start = time.time()
            while time.time() - start < SPIN_DURATION/2:
                emit_update(i, random.choice(SYMBOLS))
                time.sleep(SPIN_SPEED)
            emit_update(i, random.choice(SYMBOLS))
        socketio.emit('result', {'message': "🎞️ Preview Only (No Bet)", 'color': 'skyblue'})
    threading.Thread(target=preview_thread).start()
@socketio.on('buy_coins')
def buy_coins():
    global player_balance
    player_balance += BUY_AMOUNT
    socketio.emit('balance_update', {'balance': player_balance})
    socketio.emit('result', {'message': f"💵 Bought +${BUY_AMOUNT} coins!", 'color': 'lime'})
    socketio.emit('show_buy_button', {'show': False})
if __name__ == '__main__':
    print("Starting Star Bar Slots on http://localhost:5000")
    socketio.run(app, host='0.0.0.0', port=5000)
