from flask import Flask, render_template, redirect, url_for, flash, request
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from datetime import datetime
from config import Config
from models import db, User, TetrisLeaderboard, ConnectFourLeaderboard
from flask_migrate import Migrate
from forms import LoginForm, RegistrationForm

app = Flask(__name__)
app.config.from_object(Config)

# Initialize database
db.init_app(app)
# After your db initialization:
migrate = Migrate(app, db)

# Initialize login manager
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Please log in to access this page.'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Create database tables (updated approach for Flask 2.0+)
with app.app_context():
    db.create_all()

# Routes
@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user is None or not user.check_password(form.password.data):
            flash('Invalid username or password', 'danger')
            return redirect(url_for('login'))
        
        # Update last login time
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        login_user(user, remember=form.remember_me.data)
        next_page = request.args.get('next')
        return redirect(next_page or url_for('home'))
    
    return render_template('login.html', title='Sign In', form=form)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    
    form = RegistrationForm()
    if form.validate_on_submit():
        user = User(username=form.username.data, email=form.email.data)
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()
        flash('Registration successful! You can now log in.', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html', title='Register', form=form)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/home')
@login_required
def home():
    return render_template('home.html', title='Game Selection')

@app.route('/play/tetris')
@login_required
def tetris():
    return render_template('tetris.html', title='Tetris')

@app.route('/update_score', methods=['POST'])
@login_required
def update_score():
    if request.method == 'POST':
        score = request.json.get('score', 0)
        print(f"Received score update: {score} for user {current_user.username}")  # Debug log
        
        # Update user's high score if needed
        if score > current_user.tetris_high_score:
            current_user.tetris_high_score = score
            db.session.commit()
            
            # Always try to add to leaderboard if score is high enough
            lowest_entry = TetrisLeaderboard.query.order_by(TetrisLeaderboard.score).first()
            leaderboard_count = TetrisLeaderboard.query.count()
            
            # Should add to leaderboard if:
            # 1. There are fewer than 10 entries OR
            # 2. The score is higher than the lowest score on the board
            should_add = (leaderboard_count < 10) or (lowest_entry and score > lowest_entry.score)
            
            if should_add:
                # Check if user already has an entry
                existing_entry = TetrisLeaderboard.query.filter_by(username=current_user.username).first()
                
                if existing_entry:
                    if score > existing_entry.score:
                        existing_entry.score = score
                        existing_entry.date_achieved = datetime.utcnow()
                else:
                    # Add new entry
                    new_entry = TetrisLeaderboard(username=current_user.username, score=score)
                    db.session.add(new_entry)
                
                # Maintain only top 10 scores
                if leaderboard_count >= 10:
                    # Get all entries sorted by score
                    all_entries = TetrisLeaderboard.query.order_by(TetrisLeaderboard.score).all()
                    
                    # If we just added a new entry, we need to remove the lowest
                    if not existing_entry:
                        db.session.delete(all_entries[0])  # Remove the lowest score
                
                db.session.commit()
            
            return {'success': True, 'high_score': score}
    
    return {'success': False}

@app.route('/leaderboard/tetris')
def tetris_leaderboard():
    top_scores = TetrisLeaderboard.query.order_by(TetrisLeaderboard.score.desc()).limit(10).all()
    return render_template('tetris_leaderboard.html', title='Tetris Leaderboard', leaderboard=top_scores)

@app.route('/api/leaderboard/tetris')
def get_tetris_leaderboard():
    top_scores = TetrisLeaderboard.query.order_by(TetrisLeaderboard.score.desc()).limit(10).all()
    leaderboard = [{'username': entry.username, 'score': entry.score, 
                    'date': entry.date_achieved.strftime('%Y-%m-%d')} 
                   for entry in top_scores]
    return {'leaderboard': leaderboard}

@app.route('/play/connect-four')
@login_required
def connect_four_home():
    return render_template('connect_four_home.html', title='Connect Four')

@app.route('/play/connect-four/local')
@login_required
def connect_four_local():
    return render_template('connect_four_local.html', title='Connect Four - Local Game')

@app.route('/play/connect-four/ai')
@login_required
def connect_four_ai():
    return render_template('connect_four_ai.html', title='Connect Four - AI Game')

@app.route('/play/connect-four/online')
@login_required
def connect_four_online():
    return render_template('connect_four_online.html', title='Connect Four - Online Game')

@app.route('/leaderboard/connect-four')
@login_required
def connect_four_leaderboard():
    top_players = ConnectFourLeaderboard.query.order_by(
        (ConnectFourLeaderboard.wins - ConnectFourLeaderboard.losses).desc()
    ).limit(10).all()
    return render_template('connect_four_leaderboard.html', 
                           title='Connect Four Leaderboard', 
                           leaderboard=top_players)

@app.route('/api/connect-four/update-stats', methods=['POST'])
@login_required
def update_connect_four_stats():
    if request.method == 'POST':
        data = request.json
        game_mode = data.get('mode', '')  # 'local', 'ai', or 'online'
        result = data.get('result', '')   # 'win', 'loss', or 'draw'
        
        # Get user stats
        stats = ConnectFourLeaderboard.query.filter_by(username=current_user.username).first()
        if not stats:
            stats = ConnectFourLeaderboard(username=current_user.username)
            db.session.add(stats)
        
        # Update stats based on game mode and result
        if game_mode == 'ai':
            if result == 'win':
                stats.ai_wins += 1
            elif result == 'loss':
                stats.ai_losses += 1
        else:  # Local or online
            if result == 'win':
                stats.wins += 1
            elif result == 'loss':
                stats.losses += 1
            elif result == 'draw':
                stats.draws += 1
        
        stats.date_updated = datetime.utcnow()
        db.session.commit()
        
        return {'success': True}
    
    return {'success': False}

@app.route('/api/connect-four/leaderboard')
def get_connect_four_leaderboard():
    top_players = ConnectFourLeaderboard.query.order_by(
        (ConnectFourLeaderboard.wins - ConnectFourLeaderboard.losses).desc()
    ).limit(10).all()
    
    leaderboard = [{
        'username': player.username,
        'wins': player.wins,
        'losses': player.losses,
        'draws': player.draws,
        'ai_wins': player.ai_wins,
        'ai_losses': player.ai_losses,
        'win_rate': player.win_rate(),
        'date_updated': player.date_updated.strftime('%Y-%m-%d')
    } for player in top_players]
    
    return {'leaderboard': leaderboard}

if __name__ == '__main__':
    app.run(debug=True)