// ============================================================================
// DỮ LIỆU SÁCH MẪU KÈM VĂN BẢN ĐẦY ĐỦ ĐỂ ĐỌC, TTS VÀ HỎI ĐÁP AI
// ============================================================================

export interface SampleBookData {
    id: string;
    title: string;
    author: string;
    category: string;
    coverColor: string;
    totalPages: number;
    pages: {
        pageNumber: number;
        chapterTitle: string;
        paragraphs: string[];
    }[];
}

export const SAMPLE_BOOKS: SampleBookData[] = [
    {
        id: 'truyen-kieu',
        title: 'Truyện Kiều (Đoạn Trường Tân Thanh)',
        author: 'Đại thi hào Nguyễn Du',
        category: 'Văn học cổ điển',
        coverColor: '#8B4513',
        totalPages: 8,
        pages: [
            {
                pageNumber: 1,
                chapterTitle: 'Phần I: Gặp gỡ và đính ước',
                paragraphs: [
                    'Trăm năm trong cõi người ta,\nChữ tài chữ mệnh khéo là ghét nhau.\nTrải qua một cuộc bể dâu,\nNhững điều trông thấy mà đau đớn lòng.',
                    'Lạ gì bỉ sắc tư phong,\nTrời xanh quen thói má hồng đánh ghen.\nCảo thơm lần giở trước đèn,\nPhong tình có lục còn truyền sử xanh.',
                    'Rằng năm Gia Tĩnh triều Minh,\nBốn phương phẳng lặng hai kinh vững vàng.\nCó nhà viên ngoại họ Vương,\nTiền tài bậc trung một nàng gia tư.',
                ],
            },
            {
                pageNumber: 2,
                chapterTitle: 'Phần I: Thúy Kiều và Thúy Vân',
                paragraphs: [
                    'Đầu lòng hai ả tố nga,\nThúy Kiều là chị em là Thúy Vân.\nMai cốt cách tuyết tinh thần,\nMỗi người một vẻ mười phân vẹn mười.',
                    'Vân xem trang trọng khác vời,\nKhuôn trăng đầy đặn nét ngài nở nang.\nHoa cười ngọc thốt đoan trang,\nMây thua nước tóc tuyết nhường màu da.',
                    'Kiều càng sắc sảo mặn mà,\nSo bề tài sắc lại là phần hơn.\nLàn thu thủy nét xuân sơn,\nHoa ghen thua thắm liễu hờn kém xanh.',
                    'Một hai nghiêng nước nghiêng thành,\nSắc đành đòi một tài đành họa hai.\nThông minh vốn sẵn tính trời,\nPha nghề thi họa đủ mùi ca ngâm.',
                ],
            },
            {
                pageNumber: 3,
                chapterTitle: 'Phần I: Tiết Thanh Minh',
                paragraphs: [
                    'Thanh minh trong tiết tháng ba,\nLễ là tảo mộ hội là đạp thanh.\nGần xa nô nức yến anh,\nChị em sắm sửa bộ hành chơi xuân.',
                    'Dập dìu tài tử giai nhân,\nNgựa xe như nước áo quần như nêm.\nNgổn ngang gò đống kéo lên,\nThoi vàng vó rắc tro tiền giấy bay.',
                    'Tà tà bóng ngả về tây,\nChị em thơ thẩn dan tay ra về.\nBước dần theo ngọn tiểu khê,\nLần xem phong cảnh có bề thanh thanh.',
                ],
            },
            {
                pageNumber: 4,
                chapterTitle: 'Phần I: Nấm mồ Đạm Tiên',
                paragraphs: [
                    'Sè sè nấm đất bên đường,\nRầu rầu ngọn cỏ nửa vàng nửa xanh.\nKiều rằng: “Sao đượm mối tình,\nKìa ai mồ mả xanh xanh bên đường?”',
                    'Vương Quan mới dẫn gần xa:\n“Đạm Tiên nàng ấy xưa là ca nhi.\nNổi danh tài sắc một thì,\nXôn xao ngoài cửa hiếm gì yến anh.',
                    'Phận hồng nhan có mong manh,\nNửa chừng xuân thoắt gãy cành thiên hương.\nTrải bao thỏ lặn ác tà,\nẤy mồ vô chủ ai mà thắp nhang!”',
                ],
            },
            {
                pageNumber: 5,
                chapterTitle: 'Phần II: Gặp gỡ Kim Trọng',
                paragraphs: [
                    'Kiều rằng: “Hồng nhan tự thuở xưa,\nCái điều bạc mệnh có chừa ai đâu!\nNỗi niềm tưởng đến mà đau,\nThấy người nằm đó biết sau thế nào?”',
                    'Thoắt nghe tiếng nấc bên đường,\nChàng Kim từ buổi sang phương tìm nàng.\nĐề huề lưng túi gió trăng,\nSau lưng theo một vài thằng con con.',
                    'Tuyết in sắc ngựa biên cương,\nCỏ pha màu áo nhuộm đường xanh xanh.\nKhách đà xuống ngựa tới chào,\nNgười lên ngựa kẻ gác rào ngó trông.',
                ],
            },
            {
                pageNumber: 6,
                chapterTitle: 'Phần II: Tình trong như đã',
                paragraphs: [
                    'Người quốc sắc kẻ thiên tài,\nTình trong như đã mặt ngoài còn e.\nChập chờn ánh mắt trao nghe,\nLòng xuân phơi phới bốn bề ngát hương.',
                    'Bóng tà như giục cơn sầu,\nKhách đà lên ngựa người sầu ngóng theo.\nDưới cầu nước chảy trong veo,\nBên cầu tơ liễu bóng chiều thướt tha.',
                ],
            },
            {
                pageNumber: 7,
                chapterTitle: 'Phần III: Gia biến và chia lìa',
                paragraphs: [
                    'Cơ duyên chưa trọn tấc lòng,\nSóng đâu dồn dập vào trong gia đình.\nSai nha ập đến thình lình,\nGià trẻ kinh hãi giật mình xót xa.',
                    'Làm cho khốc hại chẳng qua vì tiền!\nKiều bèn gạt lệ thở than:\n“Chữ hiếu chữ tình bên nào nặng hơn?\nThà liều một thân cứu lấy cha già.”',
                ],
            },
            {
                pageNumber: 8,
                chapterTitle: 'Phần III: Trao duyên cho Thúy Vân',
                paragraphs: [
                    'Cậy em em có chịu lời,\nNgồi lên cho chị lạy rồi sẽ thưa.\nGiữa đường đứt gánh tương tư,\nKeo loan chắp mối tơ thừa mặc em.',
                    'Kể từ khi gặp chàng Kim,\nNgày quạt ước đêm thề nguyền cùng nhau.\nSự đâu sóng gió bất kỳ,\nHiếu tình khôn lẽ hai bề vẹn hai.',
                    'Chiếc vành với bức tờ mây,\nDuyên này thì giữ vật này của chung.\nDù khi chiếc bóng cô phòng,\nTrông ra ngọn cỏ lá bồng nhớ nhau.',
                ],
            },
        ],
    },
    {
        id: 'so-do',
        title: 'Số Đỏ',
        author: 'Vũ Trọng Phụng',
        category: 'Văn học hiện thực phê phán',
        coverColor: '#2F4F4F',
        totalPages: 4,
        pages: [
            {
                pageNumber: 1,
                chapterTitle: 'Chương I: Xuân Tóc Đỏ xuất hiện',
                paragraphs: [
                    'Cái xã hội tư sản thành thị đương thời xôn xao phong trào Âu hóa và Thể thao. Bỗng đâu xuất hiện một nhân vật kỳ dị: Xuân Tóc Đỏ, một đứa trẻ mồ côi từng nhặt bóng ở sân quần vợt, nhờ sự láu cá và thời thế tao ngộ mà từng bước leo lên tột đỉnh danh vọng.',
                    'Hôm ấy, bà Phó Đoan - một me Tây góa bụa đức hạnh - bước xuống xe hơi với dáng vẻ đài các. Ánh mắt bà dừng lại nơi chàng thanh niên tóc đỏ hoe đang bị đuổi việc vì tội nhìn trộm phòng tắm.',
                    '“Một cơ hội hiếm có!” - Xuân thầm nghĩ khi nhận ra vẻ ngạc nhiên xen lẫn thích thú trong mắt người đàn bà giàu có.',
                ],
            },
            {
                pageNumber: 2,
                chapterTitle: 'Chương II: Tiệm may Âu Hóa',
                paragraphs: [
                    'Xuân được giới thiệu đến làm việc tại tiệm may Âu Hóa của ông Văn Minh. Nơi đây là trung tâm cách tân trang phục cho giới thượng lưu Hà thành, với những bộ cánh mang tên kỳ lạ: “Ngây thơ”, “Chinh phục”, “Lời hứa hẹn”.',
                    'Bằng cái tài nói liều không biết ngượng, Xuân tán dương những ý tưởng quái gở của vợ chồng Văn Minh, biến sự dốt nát của mình thành phong thái “tự nhiên, không kiểu cách” khiến ai nấy đều thán phục.',
                ],
            },
            {
                pageNumber: 3,
                chapterTitle: 'Chương III: Trở thành Anh hùng Thể thao',
                paragraphs: [
                    'Đỉnh cao sự trớ trêu đến khi Xuân được tôn làm “giáo sư quần vợt”. Trong trận thi đấu giao hữu quốc tế với nhà vô địch Xiêm La, Xuân cố tình nhường điểm để giữ hòa khí bang giao, cứu thể diện quốc gia.',
                    'Quần chúng vỗ tay reo hò dậy sóng. Xuân đứng trên bục cao, giơ tay dõng dạc tuyên bố: “Hỡi công chúng! Ta đã hy sinh danh dự cá nhân vì nền hòa bình thế giới!”',
                ],
            },
            {
                pageNumber: 4,
                chapterTitle: 'Chương IV: Hạnh phúc của một tang gia',
                paragraphs: [
                    'Cụ Cố Hồng nằm chết là niềm vui sướng khôn tả của cả gia đình. Ai nấy đều háo hức mặc những bộ đồ tang tân thời nhất, cười nói rôm rả sau cỗ áo quan.',
                    'Đám ma to tát đi qua các phố phường, kèn Tây xen kèn ta, hoa rợp trời. Đó là bức tranh biếm họa sâu cay về một xã hội giả dối, suy đồi đến tận xương tủy dưới ngòi bút bậc thầy của Vũ Trọng Phụng.',
                ],
            },
        ],
    },
];
