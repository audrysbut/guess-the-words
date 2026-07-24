import type { RawWordEntry, WordEntry, Theme } from '@/types/game'

const movies: RawWordEntry[] = [
  { "answer": "The Shawshank Redemption", "tokens": ["The", "Shawshank", "Redemption"] },
  { "answer": "The Godfather", "tokens": ["The", "Godfather"] },
  { "answer": "The Dark Knight", "tokens": ["The", "Dark", "Knight"] },
  { "answer": "Pulp Fiction", "tokens": ["Pulp", "Fiction"] },
  { "answer": "Schindlers List", "tokens": ["Schindlers", "List"] },
  { "answer": "Forrest Gump", "tokens": ["Forrest", "Gump"] },
  { "answer": "Inception", "tokens": ["Inception"] },
  { "answer": "Fight Club", "tokens": ["Fight", "Club"] },
  { "answer": "The Matrix", "tokens": ["The", "Matrix"] },
  { "answer": "Goodfellas", "tokens": ["Goodfellas"] },
  { "answer": "Star Wars", "tokens": ["Star", "Wars"] },
  { "answer": "Jurassic Park", "tokens": ["Jurassic", "Park"] },
  { "answer": "Back to the Future", "tokens": ["Back", "to", "the", "Future"] },
  { "answer": "The Silence of the Lambs", "tokens": ["The", "Silence", "of", "the", "Lambs"] },
  { "answer": "Saving Private Ryan", "tokens": ["Saving", "Private", "Ryan"] },
  { "answer": "The Green Mile", "tokens": ["The", "Green", "Mile"] },
  { "answer": "Gladiator", "tokens": ["Gladiator"] },
  { "answer": "The Departed", "tokens": ["The", "Departed"] },
  { "answer": "Whiplash", "tokens": ["Whiplash"] },
  { "answer": "Parasite", "tokens": ["Parasite"] },
  { "answer": "Interstellar", "tokens": ["Interstellar"] },
  { "answer": "Coco", "tokens": ["Coco"] },
  { "answer": "Spirited Away", "tokens": ["Spirited", "Away"] },
  { "answer": "Mad Max Fury Road", "tokens": ["Mad", "Max", "Fury", "Road"] },
  { "answer": "The Grand Budapest Hotel", "tokens": ["The", "Grand", "Budapest", "Hotel"] },
  { "answer": "Toy Story", "tokens": ["Toy", "Story"] },
  { "answer": "Jaws", "tokens": ["Jaws"] },
  { "answer": "Eternal Sunshine of the Spotless Mind", "tokens": ["Eternal", "Sunshine", "of", "the", "Spotless", "Mind"] },
  { "answer": "The Lion King", "tokens": ["The", "Lion", "King"] },
  { "answer": "Avatar", "tokens": ["Avatar"] },
]

const actors: RawWordEntry[] = [
  { "answer": "Tom Hanks", "tokens": ["Tom", "Hanks"] },
  { "answer": "Meryl Streep", "tokens": ["Meryl", "Streep"] },
  { "answer": "Leonardo DiCaprio", "tokens": ["Leonardo", "DiCaprio"] },
  { "answer": "Denzel Washington", "tokens": ["Denzel", "Washington"] },
  { "answer": "Cate Blanchett", "tokens": ["Cate", "Blanchett"] },
  { "answer": "Morgan Freeman", "tokens": ["Morgan", "Freeman"] },
  { "answer": "Scarlett Johansson", "tokens": ["Scarlett", "Johansson"] },
  { "answer": "Brad Pitt", "tokens": ["Brad", "Pitt"] },
  { "answer": "Natalie Portman", "tokens": ["Natalie", "Portman"] },
  { "answer": "Christian Bale", "tokens": ["Christian", "Bale"] },
  { "answer": "Jennifer Lawrence", "tokens": ["Jennifer", "Lawrence"] },
  { "answer": "Samuel L Jackson", "tokens": ["Samuel", "L", "Jackson"] },
  { "answer": "Keanu Reeves", "tokens": ["Keanu", "Reeves"] },
  { "answer": "Emma Stone", "tokens": ["Emma", "Stone"] },
  { "answer": "Joaquin Phoenix", "tokens": ["Joaquin", "Phoenix"] },
  { "answer": "Viola Davis", "tokens": ["Viola", "Davis"] },
  { "answer": "Robert Downey Jr", "tokens": ["Robert", "Downey", "Jr"] },
  { "answer": "Amy Adams", "tokens": ["Amy", "Adams"] },
  { "answer": "Anthony Hopkins", "tokens": ["Anthony", "Hopkins"] },
  { "answer": "Helena Bonham Carter", "tokens": ["Helena", "Bonham", "Carter"] },
  { "answer": "Willem Dafoe", "tokens": ["Willem", "Dafoe"] },
  { "answer": "Rachel McAdams", "tokens": ["Rachel", "McAdams"] },
  { "answer": "Gary Oldman", "tokens": ["Gary", "Oldman"] },
  { "answer": "Saoirse Ronan", "tokens": ["Saoirse", "Ronan"] },
  { "answer": "Daniel Day Lewis", "tokens": ["Daniel", "Day", "Lewis"] },
  { "answer": "Margot Robbie", "tokens": ["Margot", "Robbie"] },
  { "answer": "Idris Elba", "tokens": ["Idris", "Elba"] },
  { "answer": "Tilda Swinton", "tokens": ["Tilda", "Swinton"] },
  { "answer": "John Boyega", "tokens": ["John", "Boyega"] },
  { "answer": "Lupita Nyongo", "tokens": ["Lupita", "Nyongo"] },
]

const famousPeople: RawWordEntry[] = [
  { "answer": "Albert Einstein", "tokens": ["Albert", "Einstein"] },
  { "answer": "Marie Curie", "tokens": ["Marie", "Curie"] },
  { "answer": "Nelson Mandela", "tokens": ["Nelson", "Mandela"] },
  { "answer": "Isaac Newton", "tokens": ["Isaac", "Newton"] },
  { "answer": "Frida Kahlo", "tokens": ["Frida", "Kahlo"] },
  { "answer": "Martin Luther King", "tokens": ["Martin", "Luther", "King"] },
  { "answer": "Leonardo da Vinci", "tokens": ["Leonardo", "da", "Vinci"] },
  { "answer": "William Shakespeare", "tokens": ["William", "Shakespeare"] },
  { "answer": "Cleopatra", "tokens": ["Cleopatra"] },
  { "answer": "Mahatma Gandhi", "tokens": ["Mahatma", "Gandhi"] },
  { "answer": "Stephen Hawking", "tokens": ["Stephen", "Hawking"] },
  { "answer": "Jane Austen", "tokens": ["Jane", "Austen"] },
  { "answer": "Elon Musk", "tokens": ["Elon", "Musk"] },
  { "answer": "Ada Lovelace", "tokens": ["Ada", "Lovelace"] },
  { "answer": "Winston Churchill", "tokens": ["Winston", "Churchill"] },
  { "answer": "Amelia Earhart", "tokens": ["Amelia", "Earhart"] },
  { "answer": "Vincent van Gogh", "tokens": ["Vincent", "van", "Gogh"] },
  { "answer": "Mozart", "tokens": ["Mozart"] },
  { "answer": "Beyonce", "tokens": ["Beyonce"] },
  { "answer": "David Bowie", "tokens": ["David", "Bowie"] },
  { "answer": "Freddie Mercury", "tokens": ["Freddie", "Mercury"] },
  { "answer": "Oprah Winfrey", "tokens": ["Oprah", "Winfrey"] },
  { "answer": "Pablo Picasso", "tokens": ["Pablo", "Picasso"] },
  { "answer": "Nikola Tesla", "tokens": ["Nikola", "Tesla"] },
  { "answer": "Rosa Parks", "tokens": ["Rosa", "Parks"] },
  { "answer": "Charles Darwin", "tokens": ["Charles", "Darwin"] },
  { "answer": "Florence Nightingale", "tokens": ["Florence", "Nightingale"] },
  { "answer": "Abraham Lincoln", "tokens": ["Abraham", "Lincoln"] },
  { "answer": "Serena Williams", "tokens": ["Serena", "Williams"] },
  { "answer": "Confucius", "tokens": ["Confucius"] },
]

const books: RawWordEntry[] = [
  { "answer": "To Kill a Mockingbird", "tokens": ["To", "Kill", "a", "Mockingbird"] },
  { "answer": "Nineteen Eighty Four", "tokens": ["Nineteen", "Eighty", "Four"] },
  { "answer": "Pride and Prejudice", "tokens": ["Pride", "and", "Prejudice"] },
  { "answer": "The Great Gatsby", "tokens": ["The", "Great", "Gatsby"] },
  { "answer": "Moby Dick", "tokens": ["Moby", "Dick"] },
  { "answer": "War and Peace", "tokens": ["War", "and", "Peace"] },
  { "answer": "The Catcher in the Rye", "tokens": ["The", "Catcher", "in", "the", "Rye"] },
  { "answer": "The Hobbit", "tokens": ["The", "Hobbit"] },
  { "answer": "Brave New World", "tokens": ["Brave", "New", "World"] },
  { "answer": "Fahrenheit Four Fifty One", "tokens": ["Fahrenheit", "Four", "Fifty", "One"] },
  { "answer": "Jane Eyre", "tokens": ["Jane", "Eyre"] },
  { "answer": "Wuthering Heights", "tokens": ["Wuthering", "Heights"] },
  { "answer": "The Lord of the Rings", "tokens": ["The", "Lord", "of", "the", "Rings"] },
  { "answer": "Harry Potter", "tokens": ["Harry", "Potter"] },
  { "answer": "The Alchemist", "tokens": ["The", "Alchemist"] },
  { "answer": "Dracula", "tokens": ["Dracula"] },
  { "answer": "Frankenstein", "tokens": ["Frankenstein"] },
  { "answer": "The Picture of Dorian Gray", "tokens": ["The", "Picture", "of", "Dorian", "Gray"] },
  { "answer": "Crime and Punishment", "tokens": ["Crime", "and", "Punishment"] },
  { "answer": "Alice in Wonderland", "tokens": ["Alice", "in", "Wonderland"] },
  { "answer": "The Chronicles of Narnia", "tokens": ["The", "Chronicles", "of", "Narnia"] },
  { "answer": "Gone with the Wind", "tokens": ["Gone", "with", "the", "Wind"] },
  { "answer": "The Hitchhikers Guide to the Galaxy", "tokens": ["The", "Hitchhikers", "Guide", "to", "the", "Galaxy"] },
  { "answer": "Dune", "tokens": ["Dune"] },
  { "answer": "The Handmaids Tale", "tokens": ["The", "Handmaids", "Tale"] },
  { "answer": "The Colour of Magic", "tokens": ["The", "Colour", "of", "Magic"] },
  { "answer": "Good Omens", "tokens": ["Good", "Omens"] },
  { "answer": "The Name of the Wind", "tokens": ["The", "Name", "of", "the", "Wind"] },
]

const fictionalCharacters: RawWordEntry[] = [
  { "answer": "Sherlock Holmes", "tokens": ["Sherlock", "Holmes"] },
  { "answer": "Harry Potter", "tokens": ["Harry", "Potter"] },
  { "answer": "Frodo Baggins", "tokens": ["Frodo", "Baggins"] },
  { "answer": "Darth Vader", "tokens": ["Darth", "Vader"] },
  { "answer": "James Bond", "tokens": ["James", "Bond"] },
  { "answer": "Katniss Everdeen", "tokens": ["Katniss", "Everdeen"] },
  { "answer": "Tyler Durden", "tokens": ["Tyler", "Durden"] },
  { "answer": "Hannibal Lecter", "tokens": ["Hannibal", "Lecter"] },
  { "answer": "Don Quixote", "tokens": ["Don", "Quixote"] },
  { "answer": "Loki", "tokens": ["Loki"] },
  { "answer": "Wonder Woman", "tokens": ["Wonder", "Woman"] },
  { "answer": "Tony Stark", "tokens": ["Tony", "Stark"] },
  { "answer": "Jon Snow", "tokens": ["Jon", "Snow"] },
  { "answer": "Walter White", "tokens": ["Walter", "White"] },
  { "answer": "Indiana Jones", "tokens": ["Indiana", "Jones"] },
  { "answer": "Spider Man", "tokens": ["Spider", "Man"] },
  { "answer": "Gollum", "tokens": ["Gollum"] },
  { "answer": "Peter Pan", "tokens": ["Peter", "Pan"] },
  { "answer": "Winnie the Pooh", "tokens": ["Winnie", "the", "Pooh"] },
  { "answer": "Gandalf", "tokens": ["Gandalf"] },
  { "answer": "Hercules", "tokens": ["Hercules"] },
  { "answer": "Atticus Finch", "tokens": ["Atticus", "Finch"] },
  { "answer": "Elizabeth Bennet", "tokens": ["Elizabeth", "Bennet"] },
  { "answer": "Huckleberry Finn", "tokens": ["Huckleberry", "Finn"] },
  { "answer": "Doctor Who", "tokens": ["Doctor", "Who"] },
  { "answer": "Ethan Hunt", "tokens": ["Ethan", "Hunt"] },
  { "answer": "Daenerys Targaryen", "tokens": ["Daenerys", "Targaryen"] },
  { "answer": "Rick Sanchez", "tokens": ["Rick", "Sanchez"] },
  { "answer": "Mario", "tokens": ["Mario"] },
  { "answer": "Hermione Granger", "tokens": ["Hermione", "Granger"] },
]

const videoGames: RawWordEntry[] = [
  { "answer": "The Legend of Zelda", "tokens": ["The", "Legend", "of", "Zelda"] },
  { "answer": "Super Mario Bros", "tokens": ["Super", "Mario", "Bros"] },
  { "answer": "Red Dead Redemption", "tokens": ["Red", "Dead", "Redemption"] },
  { "answer": "Minecraft", "tokens": ["Minecraft"] },
  { "answer": "Grand Theft Auto", "tokens": ["Grand", "Theft", "Auto"] },
  { "answer": "The Witcher", "tokens": ["The", "Witcher"] },
  { "answer": "Dark Souls", "tokens": ["Dark", "Souls"] },
  { "answer": "Final Fantasy", "tokens": ["Final", "Fantasy"] },
  { "answer": "Metal Gear Solid", "tokens": ["Metal", "Gear", "Solid"] },
  { "answer": "Portal", "tokens": ["Portal"] },
  { "answer": "Half Life", "tokens": ["Half", "Life"] },
  { "answer": "Elder Scrolls", "tokens": ["Elder", "Scrolls"] },
  { "answer": "Mass Effect", "tokens": ["Mass", "Effect"] },
  { "answer": "God of War", "tokens": ["God", "of", "War"] },
  { "answer": "BioShock", "tokens": ["BioShock"] },
  { "answer": "The Last of Us", "tokens": ["The", "Last", "of", "Us"] },
  { "answer": "Street Fighter", "tokens": ["Street", "Fighter"] },
  { "answer": "Resident Evil", "tokens": ["Resident", "Evil"] },
  { "answer": "Pokemon", "tokens": ["Pokemon"] },
  { "answer": "Assassins Creed", "tokens": ["Assassins", "Creed"] },
  { "answer": "World of Warcraft", "tokens": ["World", "of", "Warcraft"] },
  { "answer": "Fallout", "tokens": ["Fallout"] },
  { "answer": "Celeste", "tokens": ["Celeste"] },
  { "answer": "Hollow Knight", "tokens": ["Hollow", "Knight"] },
  { "answer": "Doom", "tokens": ["Doom"] },
  { "answer": "Undertale", "tokens": ["Undertale"] },
  { "answer": "Persona", "tokens": ["Persona"] },
  { "answer": "Monster Hunter", "tokens": ["Monster", "Hunter"] },
  { "answer": "Splatoon", "tokens": ["Splatoon"] },
  { "answer": "Horizon Zero Dawn", "tokens": ["Horizon", "Zero", "Dawn"] },
]

const rawWordBank: Record<Theme, RawWordEntry[]> = {
  movies,
  actors,
  famous_people: famousPeople,
  books,
  fictional_characters: fictionalCharacters,
  video_games: videoGames,
}

const wordBank: Record<Theme, WordEntry[]> = {} as Record<Theme, WordEntry[]>

for (const key of Object.keys(rawWordBank) as Theme[]) {
  wordBank[key] = rawWordBank[key].map(entry => ({
    ...entry,
    theme: key,
  }))
}

const usedWords = new Set<string>()

export function getRandomWord(theme: Theme): WordEntry | null {
  const words = wordBank[theme]
  if (!words || words.length === 0) return null

  const available = words.filter(w => !usedWords.has(w.answer))
  if (available.length === 0) return null

  const entry = available[Math.floor(Math.random() * available.length)]
  usedWords.add(entry.answer)
  return entry
}

export function selectWordsForGame(themes: Theme[], totalRounds: number): WordEntry[] {
  const selected: WordEntry[] = []
  usedWords.clear()

  for (let i = 0; i < totalRounds; i++) {
    const theme = themes[i % themes.length]
    const word = getRandomWord(theme)
    if (word) {
      selected.push(word)
    }
  }

  return selected
}
