import Navbar from "@/Components/Navbar";

const Layout = ({ children }) => {
    return (
        <div>
            <Navbar />
            <main>{children}</main>
        </div>
    );
};

export default Layout;