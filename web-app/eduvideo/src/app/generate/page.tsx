export default function Generate(){
    return(
        <div> 
            <h1 className = "text-center"> Videos will generate here! </h1>
            <div className = "max-w-2xl mx-auto p-4 rounded-xl neomorph-raised bg-surface-container-low group cursor-pointer transition-all duration-300 hover:scale-[1.01]">
            <div className = "border-2 border-dashed border-outline-variant rounded-lg p-12 neomorph-sunken flex flex-col items-center justify-center gap-4 bg-surface-bright">
                <div className = "rounded-full bg-primary-container/10 flex items-center justify-center">
                    <p>
                        This will be the file drop box.
                    </p>
                </div>
            </div>
            </div>
        </div>
    )
}