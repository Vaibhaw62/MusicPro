export function getGreeting(name = "Rocky") {

    const hour = new Date().getHours();

    let greeting = "Hello";

    if (hour >= 5 && hour < 12) {

        greeting = "Good Morning";

    }
    else if (hour >= 12 && hour < 17) {

        greeting = "Good Afternoon";

    }
    else if (hour >= 17 && hour < 22) {

        greeting = "Good Evening";

    }
    else {

        greeting = "Good Night";

    }

    return `${greeting}, ${name}`;
} 