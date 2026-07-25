type SidebarIconProps = {
    styles?: string
    name?: string
    imgUrl: string
    isActive?: string
    disabled?: boolean
    handleClick?: () => void
}

export function SidebarIcon({
    styles = "",
    name,
    imgUrl,
    isActive,
    disabled = false,
    handleClick = () => {},
}: SidebarIconProps) {
    return (
        <div
            className={`w-[48px] h-[48px] rounded-[10px]
            ${isActive === name ? 'bg-[#2c2f32]' : ''}
            flex justify-center items-center 
            ${!disabled ? 'cursor-pointer' : ''}
            ${styles}`}
            onClick={handleClick}
        >
            <img
                src={imgUrl}
                alt="icon"
                className={`w-1/2 h-1/2 ${isActive !== name ? 'grayscale' : ''}`}
            />
        </div>
    )
}