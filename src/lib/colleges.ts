export const COLLEGES = [
    { id: 'rvce', name: 'RV College of Engineering', city: 'Bengaluru' },
    { id: 'bmsce', name: 'BMS College of Engineering', city: 'Bengaluru' },
    { id: 'pes-rr', name: 'PES University (RR Campus)', city: 'Bengaluru' },
    { id: 'msrit', name: 'Ramaiah Institute of Technology', city: 'Bengaluru' },
    { id: 'mit-manipal', name: 'Manipal Institute of Technology', city: 'Manipal' },
    { id: 'nmit', name: 'Nitte Meenakshi Institute of Technology', city: 'Bengaluru' },
    { id: 'bmsit', name: 'BMS Institute of Technology', city: 'Bengaluru' },
    { id: 'dsce', name: 'Dayananda Sagar College of Engineering', city: 'Bengaluru' },
    { id: 'sje', name: 'St. Joseph Engineering College', city: 'Mangaluru' },
    { id: 'kle-tech', name: 'KLE Technological University', city: 'Hubballi' },
    { id: 'jss', name: 'JSS Science and Technology University', city: 'Mysuru' }
].sort((a, b) => a.name.localeCompare(b.name));
