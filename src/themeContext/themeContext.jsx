import {createContext, useState} from "react"

export const ThemeContext = createContext();

export const ThemeProvider = (children) => {
    return(
        const [theme, setTheme] = useState(localStorage.getItem("theme")|| "light")
    )
}