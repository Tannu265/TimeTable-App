from app import app, db, seed_data

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        seed_data()
        print("✅ Database ready.")
    print("🚀 Starting Flask server on http://localhost:5000")
    app.run(debug=True, port=5000)
