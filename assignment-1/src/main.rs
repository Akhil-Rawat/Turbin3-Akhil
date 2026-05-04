use rand::Rng;
use std::io;

fn get_input() -> Option<u32> {
    let mut input = String::new();

    io::stdin().read_line(&mut input).ok()?;

    match input.trim().parse::<u32>() {
        Ok(num) => Some(num),
        Err(_) => None,
    }
}

fn main() {
    println!(" Guessing Game On Turbin3 <3 ");

    let secret = rand::thread_rng().gen_range(1..=100);
    let mut attempts = 5;

    while attempts > 0 {
        println!("Enter your guess (Attempts left: {}):", attempts);

        let guess = match get_input() {
            Some(num) => num,
            None => {
                println!("Invalid input. Try again.");
                continue;
            }
        };

        if guess < secret {
            println!("Too low");
        } else if guess > secret {
            println!("Too high");
        } else {
            println!("Correct! You win ");
            return;
        }

        attempts -= 1;
    }

    println!("Game Over! The number was {}", secret);
}