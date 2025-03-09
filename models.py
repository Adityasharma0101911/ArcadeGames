from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    registered_on = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    # Store game scores/statistics
    tetris_high_score = db.Column(db.Integer, default=0)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def __repr__(self):
        return f'<User {self.username}>'

class TetrisLeaderboard(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    date_achieved = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<TetrisLeaderboard {self.username}: {self.score}>'
    
class ConnectFourLeaderboard(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), nullable=False)
    wins = db.Column(db.Integer, default=0)
    losses = db.Column(db.Integer, default=0)
    draws = db.Column(db.Integer, default=0)
    ai_wins = db.Column(db.Integer, default=0)
    ai_losses = db.Column(db.Integer, default=0)
    date_updated = db.Column(db.DateTime, default=datetime.utcnow)
    
    def win_rate(self):
        total_games = self.wins + self.losses
        if total_games == 0:
            return 0
        return round((self.wins / total_games) * 100, 1)
    
    def __repr__(self):
        return f'<ConnectFourLeaderboard {self.username}: {self.wins} wins>'