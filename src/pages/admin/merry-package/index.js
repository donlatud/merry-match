import { useState } from "react";
import AdminSideBar from "@/components/AdminSideBar"
import DatePicker from "@/components/commons/input/DatePicker"

function MerryPackage() {
    const [date, setDate] = useState("");
    return(
        <>
        <AdminSideBar />
        <DatePicker
            value={date}
            onChange={setDate}
            placeholder="Choose date"
        />
        </>
    )
}

export default MerryPackage