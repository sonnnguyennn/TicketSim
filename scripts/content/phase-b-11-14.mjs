// Phase B: explicit case revisions; original source tickets, IDs and grading keys are retained.
export const sampleIds = ["VPS-11-001","VPS-12-004","VPS-13-006","VPS-14-008"]
export const topicEdits = {
  "VPS-14-005": {
    "objective": "Phân biệt addon IPv4 đã active với địa chỉ thực sự được IPAM cấp.",
    "customerExplanation": "Khách đã mua IPv4 bổ sung nhưng vẫn chỉ thấy một IP. Cần xem billing và tiến trình cấp phát riêng.",
    "hints": [
      "Addon Active không tự xác nhận có địa chỉ mới.",
      "So addon với manual review, ownership và pool capacity.",
      "Ownership đã xác minh nhưng pool assignment pending; ba IP trống đều reserved cho yêu cầu đã duyệt. Không tự chọn một IP."
    ],
    "verificationPrompt": "Ghi addon, review case và capacity đã reserved. Nêu đội IPAM, trạng thái được phép báo khách và cách xác minh IP thứ hai sau cấp phát được duyệt.",
    "probes": {
      "P1": {
        "purpose": "Đọc trạng thái addon IPv4 trong billing.",
        "why": "Xác nhận quyền lợi đã ghi nhận trước kiểm tra cấp địa chỉ.",
        "meaning": "Additional IPv4 active là trạng thái addon, không phải địa chỉ đã được gán trong guest."
      },
      "P2": {
        "purpose": "Đọc tiến trình IP allocation.",
        "why": "Cần biết vì sao chưa có địa chỉ bổ sung để cấu hình.",
        "meaning": "Pending manual review: cấp phát chưa hoàn tất, chưa có IP mới được xác nhận."
      },
      "G1": {
        "purpose": "Đọc bước review còn chờ.",
        "why": "Tách kiểm tra owner với việc chọn địa chỉ từ pool.",
        "meaning": "Ownership complete nhưng pool assignment pending; chưa thể hứa IP cụ thể hoặc ETA."
      },
      "G2": {
        "purpose": "Đọc IPv4 capacity và reservation.",
        "why": "Một địa chỉ free có thể đã được giữ cho request khác.",
        "meaning": "Ba IPv4 trống đều reserved cho yêu cầu đã duyệt; không phải ba IP tùy ý cấp cho order này."
      }
    },
    "questions": {
      "triage": {
        "prompt": "Khách thấy thiếu điều gì sau mua addon?",
        "explanation": "Quyền lợi và tài nguyên được áp có thể chưa đồng thời.",
        "options": {
          "symptom": [
            "Chưa thấy IPv4 bổ sung sau khi mua addon.",
            "Cần đối chiếu billing với allocation."
          ],
          "other": [
            "IP hiện tại bị mất khỏi guest sau reboot.",
            "Khách vẫn có một IP, yêu cầu thêm địa chỉ."
          ],
          "cause": [
            "Addon active chứng minh guest đã nhận IP mới.",
            "Chưa đọc allocation hoặc guest configuration."
          ]
        }
      },
      "check": {
        "prompt": "Mục nào xác nhận addon đã được kích hoạt trong billing?",
        "explanation": "Kiểm tra quyền lợi trước, không nhầm nó với IPAM assignment.",
        "options": {
          "direct": [
            "BILLING: addon",
            "Đọc trạng thái addon của order."
          ],
          "wrong1": [
            "PANEL: IP allocation",
            "Cho tiến trình cấp IP, không thay trạng thái billing."
          ],
          "wrong2": [
            "ip -4 addr",
            "Cho IP guest hiện có, không xác nhận addon đã thanh toán/active."
          ]
        }
      },
      "output": {
        "prompt": "Addon active, review chưa xong và IP trống đã reserved. Điều gì đúng?",
        "explanation": "Cần đội IPAM giải quyết assignment; không gán IP theo suy đoán.",
        "options": {
          "supported": [
            "Addon có hiệu lực, cấp IP vẫn đang chờ.",
            "Billing và IPAM là hai trạng thái cần tiếp tục đối chiếu."
          ],
          "over": [
            "IP mới chắc chắn đã có trong guest vì addon Active.",
            "Allocation còn pending."
          ],
          "ignore": [
            "Thấy free IPv4 là có thể lấy ngay cho khách.",
            "Các IP đã reserved cho request khác hoặc cần phê duyệt."
          ]
        }
      },
      "evidence": {
        "prompt": "Chọn hai trạng thái ban đầu của addon và allocation.",
        "explanation": "Không suy địa chỉ guest từ nhãn billing.",
        "options": {
          "p1": [
            "Addon IPv4 là active.",
            "Đọc từ billing."
          ],
          "p2": [
            "Allocation đang pending manual review.",
            "Cấp phát chưa hoàn tất."
          ],
          "over": [
            "Guest đã nhận thêm IP.",
            "Chưa có IPAM assignment hoặc phép đọc guest xác nhận."
          ]
        }
      },
      "decision": {
        "prompt": "Nên tiếp tục yêu cầu IPv4 bổ sung thế nào?",
        "explanation": "Đúng đội có quyền pool, không thay IP đang hoạt động để thử.",
        "options": {
          "safe": [
            "Chuyển IPAM đối chiếu review, reservation và order.",
            "Báo trạng thái trung thực, chỉ hứa mốc đã được xác nhận."
          ],
          "unsafe": [
            "Gán một IP đoán hoặc đổi IP guest đang dùng.",
            "Có thể trùng địa chỉ và làm rớt quản trị."
          ],
          "close": [
            "Đóng ticket vì addon Active.",
            "Yêu cầu thêm IP chưa được đáp ứng."
          ]
        }
      },
      "order": {
        "prompt": "Sắp xếp xử lý addon IPv4 chưa được cấp.",
        "explanation": "Quyền lợi và capacity trước, cấp phát có quyền sau, xác minh cuối.",
        "options": {
          "evidence": [
            "So addon, review case, ownership và pool reservation.",
            "Biết bước nào còn chờ trước tác động guest."
          ],
          "verify": [
            "So IPAM/panel/guest và route, thử IP mới từ client.",
            "Chỉ cấu hình guest sau khi có IP/gateway đúng."
          ],
          "act": [
            "IPAM hoàn tất review/assignment theo quyền, rồi change mạng có duyệt.",
            "Không tự lấy địa chỉ từ pool."
          ]
        }
      }
    },
    "review": {
      "technical": "Free nhưng reserved không là available for all; addon active khác guest IP.",
      "editorial": "Câu hỏi phân biệt entitlement, review, assignment.",
      "references": [],
      "fixtureChanges": []
    },
    "answerOverrides": {
      "expected_diagnosis": "Addon IPv4 active nhưng allocation pending manual review; pool free đã reserved.",
      "recommended_next_checks": "So order, review case, owner, policy, pool assignment và thời gian xử lý được xác nhận.",
      "resolution_guidance": "Chuyển IPAM/operations hoàn tất đúng quy trình; rồi lập network change cho IP được cấp.",
      "verification": "IPv4 thứ hai có trong IPAM/panel/guest, route đúng và client thử thành công theo policy.",
      "escalate_when": "Cần IPAM phê duyệt hoặc quản lý pool.",
      "production_warning": "Không gán IP bất kỳ hoặc đổi IP đang dùng để thử addon."
    }
  },
  "VPS-14-006": {
    "objective": "Đọc thời hạn xóa dữ liệu và trạng thái hold để chuyển yêu cầu gia hạn đúng người trước deadline.",
    "customerExplanation": "Khách nhận thông báo hết hạn và muốn giữ dữ liệu lâu hơn. Cần xác minh thời hạn xóa và policy, chưa thể hứa giữ vô hạn.",
    "hints": [
      "Hết hạn dịch vụ không đồng nghĩa dữ liệu đã xóa.",
      "So expired date với scheduled deletion và hold state.",
      "Ngày xóa 25/10, hold false và backup chưa thử restore. Chuyển billing/lifecycle xin hold có audit trước deadline, chưa bảo đảm được duyệt."
    ],
    "verificationPrompt": "Ghi expiration, deletion deadline, hold và backup. Nêu bước chuyển khẩn, quyền duyệt, thời hạn mới cần xác nhận và cách kiểm tra dữ liệu.",
    "probes": {
      "P1": {
        "purpose": "Đọc ngày dịch vụ hết hạn.",
        "why": "Cần phân biệt hết hạn với đã thực hiện xóa.",
        "meaning": "Hết hạn 20/10; không chứng minh dữ liệu còn nguyên hoặc đã xóa."
      },
      "P2": {
        "purpose": "Đọc lịch xóa theo retention.",
        "why": "Xác định deadline cần chuyển yêu cầu giữ dữ liệu.",
        "meaning": "Scheduled deletion 25/10 là lịch dự kiến; cần kiểm tra task/hold và quyền ngoại lệ."
      },
      "G1": {
        "purpose": "Đọc hold hiện tại và deletion job.",
        "why": "Không coi ticket xin gia hạn là hold đã áp.",
        "meaning": "hold=false, job 25/10 00:00 UTC; chưa có lệnh giữ dữ liệu được xác nhận."
      },
      "G2": {
        "purpose": "Đọc backup hiện có và restore verification.",
        "why": "Đánh giá nguồn dự phòng nếu không được gia hạn.",
        "meaning": "Backup 19/10 tồn tại nhưng restore pending; chưa cam kết dữ liệu phục hồi được."
      }
    },
    "questions": {
      "triage": {
        "prompt": "Khách cần quyết định gì trước khi dữ liệu tới hạn?",
        "explanation": "Tiếp nhận yêu cầu giữ lại không đồng nghĩa đã được gia hạn.",
        "options": {
          "symptom": [
            "Xin kéo dài thời gian lưu dữ liệu.",
            "Cần kiểm tra deadline và người có quyền."
          ],
          "other": [
            "Xin xóa VPS và backup ngay hôm nay.",
            "Ngược với yêu cầu giữ lại."
          ],
          "cause": [
            "Ticket này bảo đảm giữ dữ liệu vô hạn.",
            "Chưa có policy hoặc approval ngoại lệ."
          ]
        }
      },
      "check": {
        "prompt": "Mục nào cho biết ngày dịch vụ đã hết hạn?",
        "explanation": "Ngày expired và lịch deletion là hai mốc riêng.",
        "options": {
          "direct": [
            "BILLING: expired",
            "Đọc mốc hết hạn của dịch vụ."
          ],
          "wrong1": [
            "PANEL: retention",
            "Cho lịch xóa, không thay ngày hết hạn billing."
          ],
          "wrong2": [
            "PANEL: backup availability VPS-1406",
            "Cho bản backup, không cho expiration."
          ]
        }
      },
      "output": {
        "prompt": "Expired 20/10, xóa 25/10 và hold false. Nên trả lời thế nào?",
        "explanation": "Cần xử lý trước deadline nhưng không hứa ngoại lệ chưa được duyệt.",
        "options": {
          "supported": [
            "Cần chuyển khẩn xin hold theo quyền trước deadline.",
            "Hiện chưa có hold và backup cũng chưa verified restore."
          ],
          "over": [
            "Support có thể hứa giữ dữ liệu vô hạn.",
            "Policy và người duyệt quyết định phạm vi gia hạn."
          ],
          "ignore": [
            "Expired nghĩa là dữ liệu đã xóa nên không cần xem job.",
            "Bản ghi còn scheduled deletion tươnglai cần được đối chiếu."
          ]
        }
      },
      "evidence": {
        "prompt": "Chọn hai mốc billing/retention đã nêu.",
        "explanation": "Không suy trạng thái dữ liệu từ lịch đơn thuần.",
        "options": {
          "p1": [
            "Dịch vụ hết hạn 20/10.",
            "Đọc từ billing expired."
          ],
          "p2": [
            "Lịch xóa là 25/10.",
            "Đây là deadline cần đối chiếu task."
          ],
          "over": [
            "Yêu cầu ticket đã tự đặt hold.",
            "G1 ghi hold false; chưa được áp giữ lại."
          ]
        }
      },
      "decision": {
        "prompt": "Ai cần tiếp nhận yêu cầu giữ dữ liệu này?",
        "explanation": "Đúng owner và đội policy cần quyết định, tránh hứa điều chưa áp.",
        "options": {
          "safe": [
            "Xác minh owner rồi chuyển billing/lifecycle xin hold có audit.",
            "Thông báo deadline và chỉ xác nhận gia hạn khi đã có task/decision."
          ],
          "unsafe": [
            "Tự hủy deletion job hoặc hứa dữ liệu chưa sao luôn an toàn.",
            "Vượt quyền và không xác minh khả năng restore."
          ],
          "close": [
            "Đóng ticket ngay khi gửi yêu cầu hold.",
            "Gửi request chưa có nghĩa hold đã được áp."
          ]
        }
      },
      "order": {
        "prompt": "Sắp xếp xử lý gia hạn retention trước ngày xóa.",
        "explanation": "Xác nhận mốc và quyền trước, xin hold sau, kiểm tra trạng thái thật cuối.",
        "options": {
          "evidence": [
            "Xác minh owner, expiration, deletion job, hold và backup.",
            "Biết rủi ro và thời gian còn lại."
          ],
          "verify": [
            "Kiểm tra hold/extension đã áp, deadline mới và data/backup status.",
            "Quyết định duyệt cần được áp trong hệ thống."
          ],
          "act": [
            "Đội được quyền xử lý ngoại lệ retention có audit trước deadline.",
            "Support không tự bỏ deletion task."
          ]
        }
      }
    },
    "review": {
      "technical": "Expired khác deleted; request khác applied hold; pending restore không bảo đảm dữ liệu.",
      "editorial": "Câu hỏi theo deadline và authority, không generic warning.",
      "references": [],
      "fixtureChanges": []
    },
    "answerOverrides": {
      "expected_diagnosis": "Dịch vụ hết hạn 20/10, xóa lịch 25/10, hold false; backup 19/10 chưa xác minh restore.",
      "recommended_next_checks": "Xác minh owner, renewal, retention job, policy và khả năng backup trước deadline.",
      "resolution_guidance": "Chuyển billing/lifecycle on-call xin ngoại lệ hold có audit; chỉ hứa thời hạn đã được duyệt và áp.",
      "verification": "Kiểm tra hold/renewal, deadline mới, data/backup status và khách xác nhận phương án.",
      "escalate_when": "Cần policy owner hoặc quyết định khẩn trước deletion.",
      "production_warning": "Không tự hủy job xóa hoặc hứa giữ dữ liệu vô hạn; backup chưa thử không bảo đảm restore."
    }
  },
  "VPS-14-007": {
    "objective": "Đối soát invoice line, order, VM và payment ledger trước quyết định điều chỉnh hóa đơn.",
    "customerExplanation": "Khách bị tính tiền hai VPS trong khi chỉ đặt một. Cần phân biệt dòng hóa đơn trùng với hai VM hoặc hai giao dịch thu tiền.",
    "hints": [
      "Hai invoice line không tự nghĩa là hai lần charge.",
      "So service ID, số VM, order quantity và settled ledger.",
      "Hai dòng cùng VPS-100, một VM, order quantity 1; ledger một giao dịch có amount 2 plan. Chuyển billing tính điều chỉnh, không tự refund."
    ],
    "verificationPrompt": "Ghi invoice/order/payment IDs, số VM và số tiền ledger. Phân biệt line trùng với charge trùng, nêu đội điều chỉnh và cách xác minh hóa đơn/refund.",
    "probes": {
      "P1": {
        "purpose": "Đọc các dòng tính phí trên invoice.",
        "why": "Cần biết khách bị tính hai plan cho hai ID hay một ID.",
        "meaning": "Hai dòng cùng VPS-100; chưa biết gateway thu mấy lần hoặc tổng tiền đã settled."
      },
      "P2": {
        "purpose": "Đếm dịch vụ thực theo ID trong panel.",
        "why": "Phân biệt dòng billing trùng với hai vps được cấp.",
        "meaning": "VPS-100 chỉ tồn tại một lần; cần so order và payment ledger."
      },
      "G1": {
        "purpose": "Đọc settled payment ledger của invoice.",
        "why": "Xác định số giao dịch và số tiền thực đã thu.",
        "meaning": "Một giao dịch pay-1407 amount bằng hai plan; khác với hai lần charge. Tổng điều chỉnh cần billing xác nhận."
      },
      "G2": {
        "purpose": "Đọc order quantity và số VM provisioned.",
        "why": "Xác nhận số lượng khách đặt và được cấp.",
        "meaning": "Order quantity 1 và VM count 1, củng cố billing mismatch, không tự cấp quyền refund."
      }
    },
    "questions": {
      "triage": {
        "prompt": "Khách muốn đối soát chênh lệch nào?",
        "explanation": "Chưa chọn lỗi billing hay cấp phát trước khi xem record.",
        "options": {
          "symptom": [
            "Hóa đơn tính hai VPS nhưng chỉ đặt một.",
            "Cần so invoice với order/resource."
          ],
          "other": [
            "Khách đặt hai và chỉ được cấp một VPS.",
            "Ngược số lượng khách báo."
          ],
          "cause": [
            "Đã biết gateway thu hai giao dịch riêng.",
            "Chưa xem settled ledger; số line không là số charge."
          ]
        }
      },
      "check": {
        "prompt": "Mục nào cho biết invoice đang tính những service ID nào?",
        "explanation": "Đọc invoice trước đối chiếu resource và payment.",
        "options": {
          "direct": [
            "BILLING: invoice lines",
            "Liệt kê các dòng tính phí theo service."
          ],
          "wrong1": [
            "PANEL: service records",
            "Cho dịch vụ thực, không cho các dòng invoice."
          ],
          "wrong2": [
            "PANEL: order history VPS-100",
            "Cho quantity đặt, không cho các dòng tính phí."
          ]
        }
      },
      "output": {
        "prompt": "Hai invoice lines, cùng service, một VM. Cần xử lý nhận định nào?",
        "explanation": "Cần ledger/order để định mismatch, không tự refund từ số line.",
        "options": {
          "supported": [
            "Nghi billing line trùng, cần đối soát ledger.",
            "G1/G2 bổ sung một charge 2 plan và order 1; billing xác định điều chỉnh."
          ],
          "over": [
            "Refund một dòng ngay không cần kiểm tra tiền thu/tax.",
            "Có thể sai lượng điều chỉnh hoặc chưa thu đủ; đúng đội cần đối soát."
          ],
          "ignore": [
            "Một VM nghĩa là invoice không thể sai.",
            "Resource count không bảo đảm số dòng tính phí đúng."
          ]
        }
      },
      "evidence": {
        "prompt": "Chọn hai quan sát invoice và panel cho biết.",
        "explanation": "Chưa biết số giao dịch từ hai phép đọc ban đầu.",
        "options": {
          "p1": [
            "Có hai invoice line cùng VPS-100.",
            "Đây là ID trùng trên hóa đơn."
          ],
          "p2": [
            "Panel chỉ có một VPS-100.",
            "Đây là resource count khác số line."
          ],
          "over": [
            "Đã được quyền tự refund một plan.",
            "Chưa có decision billing hoặc tax/ledger reconciliation."
          ]
        }
      },
      "decision": {
        "prompt": "Nên điều chỉnh mismatch hóa đơn qua bên nào?",
        "explanation": "Giữ ID và dữ liệu đối soát, không thay resource để làm hóa đơn đúng.",
        "options": {
          "safe": [
            "Chuyển billing đối soát giao dịch.",
            "Billing tính đúng amount/credit/tax và ghi audit."
          ],
          "unsafe": [
            "Xóa VM hoặc sửa invoice thủ công không audit.",
            "Có thể mất dữ liệu và không khớp ledger."
          ],
          "close": [
            "Đóng ticket vì panel chỉ hiện một VM.",
            "Số tiền hóa đơn vẫn chưa được xử lý."
          ]
        }
      },
      "order": {
        "prompt": "Sắp xếp đối soát hóa đơn tính hai VPS.",
        "explanation": "Nhận diện record trước, đội có quyền sửa sau, đối chiếu kết quả cuối.",
        "options": {
          "evidence": [
            "So order/invoice/payment IDs, quantity và VM count.",
            "Tách line, giao dịch và resource."
          ],
          "verify": [
            "So hoá đơn đúng, credit/refund ledger và khách xác nhận dịch vụ.",
            "Sửa line chưa đủ nếu số tiền hoặc payment không khớp."
          ],
          "act": [
            "Billing xét và áp điều chỉnh có audit, theo policy.",
            "Support không tự định số tiền refund."
          ]
        }
      }
    },
    "review": {
      "technical": "Two lines khác double charge; g1 single charge 2 plan; tax/refund phải reconcile.",
      "editorial": "Dùng invoice/order/payment/VM để kiểm tra 4 khái niệm.",
      "references": [],
      "fixtureChanges": []
    },
    "answerOverrides": {
      "expected_diagnosis": "Hai invoice line cùng VPS-100 nhưng một VM/order quantity 1; ledger một charge amount 2 plan.",
      "recommended_next_checks": "So invoice/order/payment IDs, adjustments, tax và số tiền settled, không đồng nhất line với số charge.",
      "resolution_guidance": "Billing đối soát và sửa invoice/credit/refund theo policy có audit; support không tự sửa số tiền.",
      "verification": "Hóa đơn, ledger, resource count khớp và khách xác nhận kết quả.",
      "escalate_when": "Billing reconciliation bắt buộc khi cần điều chỉnh số tiền hay refund.",
      "production_warning": "Không xóa VM để làm khớp hóa đơn hoặc tự refund một line chưa kiểm tra ledger."
    }
  },
  "VPS-14-001": {
    "objective": "Đối chiếu lý do đình chỉ, hóa đơn và thanh toán trước khi hướng dẫn khôi phục dịch vụ.",
    "customerExplanation": "Dashboard đột ngột báo Suspended. Cần kiểm tra lý do và hóa đơn, chưa thể mặc định VPS hỏng hoặc yêu cầu khách trả thêm.",
    "hints": [
      "Suspended là trạng thái dịch vụ, không phải kết quả kiểm tra SSH.",
      "Đọc lý do ở service, mã hóa đơn và giao dịch đã settled.",
      "Service gắn invoice overdue; chưa có settled payment trong lần đọc. Xác minh owner và quy trình billing, không tự unsuspend."
    ],
    "verificationPrompt": "Ghi lý do đình chỉ, invoice và thanh toán tại thời điểm kiểm tra. Nêu quy trình billing và cách kiểm tra Active cùng kết nối khách sau xử lý.",
    "probes": {
      "P1": {
        "purpose": "Đọc lý do đình chỉ dịch vụ.",
        "why": "Cần biết phải chuyển billing, security hay đội kỹ thuật.",
        "meaning": "Suspended: invoice overdue gắn việc đình chỉ với nợ phí trong bản ghi hiện tại; không nói hệ điều hành hỏng."
      },
      "P2": {
        "purpose": "Đọc hóa đơn đang quá hạn.",
        "why": "Đối chiếu đúng invoice trước hỏi khách về thanh toán.",
        "meaning": "INV-2026-101 đang overdue; cần kiểm tra giao dịch, không chỉ dựa ảnh chuyển tiền."
      },
      "G1": {
        "purpose": "Đọc giao dịch đã được ghi nhận thanh toán.",
        "why": "Tránh yêu cầu trả tiền trùng hoặc mở lại khi chưa đối soát.",
        "meaning": "Chưa có settled payment lúc 10:00 UTC; đây là trạng thái tại thời điểm đọc, không khẳng định khách chưa từng gửi tiền."
      }
    },
    "questions": {
      "triage": {
        "prompt": "Trạng thái nào khách vừa thấy trên dashboard?",
        "explanation": "Đọc nguyên nhân sau, chưa coi mọi đình chỉ là lỗi guest.",
        "options": {
          "symptom": [
            "Dịch vụ hiện Suspended.",
            "Đúng trạng thái khách cần được giải thích."
          ],
          "other": [
            "VPS đang Active nhưng chỉ SSH lỗi.",
            "Khách nêu Suspended, chưa có bằng chứng lỗi SSH riêng."
          ],
          "cause": [
            "Guest OS đã hỏng nên bị đình chỉ.",
            "Lời khách chưa xác nhận lý do hoặc tình trạng guest."
          ]
        }
      },
      "check": {
        "prompt": "Mục nào nêu lý do dịch vụ bị Suspended?",
        "explanation": "Đúng hồ sơ dịch vụ trước khi kiểm tra invoice hoặc guest.",
        "options": {
          "direct": [
            "BILLING: service",
            "Ghi lý do của trạng thái đình chỉ."
          ],
          "wrong1": [
            "PANEL: invoices",
            "Giúp đối chiếu nợ phí nhưng không bao quát mọi lý do hold."
          ],
          "wrong2": [
            "PANEL: VM state",
            "Running/stopped không giải thích nguyên nhân quản lý dịch vụ."
          ]
        }
      },
      "output": {
        "prompt": "Service ghi invoice overdue, hóa đơn cũng overdue. Hướng xử lý nào có căn cứ?",
        "explanation": "Khôi phục phụ thuộc đối soát và policy billing, không phải reboot guest.",
        "options": {
          "supported": [
            "Kiểm tra thanh toán và quy trình billing.",
            "Bản ghi hiện tại gắn hold với invoice, chưa có quyền tự mở lại."
          ],
          "over": [
            "Reboot VM sẽ bỏ được hold của hóa đơn.",
            "Power action không sửa trạng thái thanh toán hoặc policy."
          ],
          "ignore": [
            "Chỉ cần sửa SSH để bỏ Suspended.",
            "SSH trong guest không quyết định billing hold."
          ]
        }
      },
      "evidence": {
        "prompt": "Chọn hai trạng thái được service và invoice ghi.",
        "explanation": "Chưa biến overdue thành kết luận khách chưa hề thanh toán.",
        "options": {
          "p1": [
            "Service Suspended vì invoice overdue.",
            "Đây là lý do trong hồ sơ dịch vụ."
          ],
          "p2": [
            "INV-2026-101 đang overdue.",
            "Cần so giao dịch của đúng hóa đơn."
          ],
          "over": [
            "Reboot đã được phép để mở hold.",
            "Không có approval hoặc cơ chế này trong dữ liệu."
          ]
        }
      },
      "decision": {
        "prompt": "Khách hỏi cách hoạt động lại. Support nên làm gì?",
        "explanation": "Xác minh owner và payment trước, không bypass policy hoặc thu dữ liệu thẻ.",
        "options": {
          "safe": [
            "Xác minh invoice/payment và hướng dẫn billing đúng quy trình.",
            "Chuyển billing khi cần đối soát hoặc quyết định khôi phục."
          ],
          "unsafe": [
            "Tự unsuspend hoặc yêu cầu gửi số thẻ qua ticket.",
            "Vượt quyền hoặc đưa thông tin thanh toán nhạy cảm vào kênh hỗ trợ."
          ],
          "close": [
            "Đóng ticket khi gửi được đường dẫn thanh toán.",
            "Còn cần xác nhận kết quả billing và dịch vụ khách."
          ]
        }
      }
    },
    "review": {
      "technical": "Payment snapshot khác việc khách đã gửi tiền; không dùng reboot hoặc SSH để bypass billing hold.",
      "editorial": "Tách đình chỉ, hóa đơn và settlement bằng câu cụ thể.",
      "references": [],
      "fixtureChanges": []
    },
    "answerOverrides": {
      "expected_diagnosis": "Service đình chỉ vì invoice overdue; INV-2026-101 quá hạn và snapshot chưa có settled payment.",
      "recommended_next_checks": "Xác minh owner, invoice/payment ID và thời điểm; nếu khách đã trả thì đối soát thay vì thu thêm.",
      "resolution_guidance": "Hướng dẫn billing hoặc chuyển đội đối soát/unsuspend theo policy, không bypass.",
      "verification": "Billing xác nhận Active, VM/dịch vụ khách truy cập được.",
      "escalate_when": "Cần billing quyết định hoặc payment không khớp.",
      "production_warning": "Không hỏi thông tin thẻ qua ticket hoặc reboot để bỏ hold."
    }
  },
  "VPS-14-002": {
    "objective": "Tách trạng thái hóa đơn Paid với sự kiện provisioning, tránh thu tiền hoặc tạo VPS trùng.",
    "customerExplanation": "Khách đã trả tiền nhưng VPS vẫn pending. Cần đối chiếu payment và sự kiện chuyển sang cấp phát.",
    "hints": [
      "Paid không chứng minh task cấp phát đã nhận sự kiện.",
      "So invoice, provision status và webhook audit theo payment/order ID.",
      "Payment settled nhưng webhook delivery failed. Cần reconcile có kiểm tra trùng, không thu tiền lại."
    ],
    "verificationPrompt": "Ghi payment/order ID, trạng thái Paid, event lỗi và đội tiếp nhận. Nêu cách retry an toàn tránh cấp trùng và xác minh VPS dùng được.",
    "probes": {
      "P1": {
        "purpose": "Đọc trạng thái hóa đơn.",
        "why": "Xác nhận hệ thống billing đã ghi nhận thanh toán chưa.",
        "meaning": "Paid xác nhận trạng thái invoice; chưa nói task provisioning đã nhận event."
      },
      "P2": {
        "purpose": "Đọc bước provisioning đang chờ.",
        "why": "Phân biệt payment thất bại với sự kiện chưa tới bộ cấp phát.",
        "meaning": "Waiting on payment event nghĩa là provisioner còn chờ event, mâu thuẫn invoice Paid cần đối soát."
      },
      "G1": {
        "purpose": "Đọc audit payment và webhook theo order.",
        "why": "Xác định giao dịch nào đã settled và event nào lỗi.",
        "meaning": "pay-2202 settled 09:10 UTC, webhook failed cho ord-1402. Reconcile phải dùng cùng ID để tránh cấp trùng."
      }
    },
    "questions": {
      "triage": {
        "prompt": "Điều gì khách đã làm nhưng VPS chưa tiếp tục?",
        "explanation": "Chưa đồng nhất pending với thanh toán thất bại.",
        "options": {
          "symptom": [
            "Đã trả tiền nhưng VPS còn pending.",
            "Cần đối chiếu hai hệ thống."
          ],
          "other": [
            "Khách chưa từng gửi thanh toán nào.",
            "Khách nói đã trả; cần kiểm chứng thay vì bác bỏ."
          ],
          "cause": [
            "Pending chứng minh cần thanh toán lại.",
            "Còn có khả năng event thiếu hoặc xử lý chậm."
          ]
        }
      },
      "check": {
        "prompt": "Đọc đâu để xác nhận billing đã ghi Paid chưa?",
        "explanation": "Invoice và provision state là hai phép đọc khác nhau.",
        "options": {
          "direct": [
            "BILLING: invoice",
            "Cho trạng thái thanh toán hóa đơn."
          ],
          "wrong1": [
            "PANEL: provision status",
            "Cho bước cấp phát, không thay billing ledger."
          ],
          "wrong2": [
            "PANEL: VM list",
            "Có hoặc chưa có VM không xác nhận invoice Paid."
          ]
        }
      },
      "output": {
        "prompt": "Invoice Paid nhưng provisioner chờ event. Điều gì cần điều tra?",
        "explanation": "Bất đồng trạng thái cần event audit, không yêu cầu khách trả trùng.",
        "options": {
          "supported": [
            "Đối soát payment event với provisioning.",
            "Webhook có thể lỗi hoặc trễ, cần ID và trạng thái cụ thể."
          ],
          "over": [
            "Thu thêm một lần để provisioning bắt đầu.",
            "Paid đã được ghi; trả lại có thể tạo charge trùng."
          ],
          "ignore": [
            "Cứ tạo VM thứ hai vì event chưa tới.",
            "Có thể task cũ chạy lại và cấp phát trùng."
          ]
        }
      },
      "evidence": {
        "prompt": "Chọn hai trạng thái đang không khớp.",
        "explanation": "Hai trạng thái không tự cấp quyền retry thiếu kiểm soát.",
        "options": {
          "p1": [
            "Invoice ghi Paid.",
            "Đây là trạng thái billing."
          ],
          "p2": [
            "Provisioner ghi Waiting on payment event.",
            "Đây là bước đang chờ của cấp phát."
          ],
          "over": [
            "Khách bắt buộc thanh toán lại.",
            "Chưa có dữ liệu hỗ trợ việc thu thêm."
          ]
        }
      },
      "decision": {
        "prompt": "Nên cho hai hệ thống khớp lại bằng cách nào?",
        "explanation": "Reconcile dùng payment/order ID và kiểm tra đã xử lý để tránh cấp trùng.",
        "options": {
          "safe": [
            "Chuyển billing/provisioning đối soát và resume có kiểm tra trùng.",
            "Giữ nguyên payment, order và kết quả task để retry an toàn."
          ],
          "unsafe": [
            "Thu tiền lại hoặc tạo VM thủ công bên ngoài order.",
            "Có thể tạo cả charge và resource trùng."
          ],
          "close": [
            "Đóng ticket vì invoice đã Paid.",
            "VPS pending chưa đáp ứng yêu cầu sử dụng."
          ]
        }
      }
    },
    "review": {
      "technical": "Settled event khác event delivery; reconciliation cần idempotency, không thu lại.",
      "editorial": "Câu hỏi gắn Paid/Waiting/pay-2202 thay generic state.",
      "references": [],
      "fixtureChanges": []
    },
    "answerOverrides": {
      "expected_diagnosis": "Invoice Paid nhưng provisioner chờ event; audit ghi settled payment và webhook delivery failed.",
      "recommended_next_checks": "So payment/order IDs, event delivery, retry history và resource đã tạo.",
      "resolution_guidance": "Billing/provisioning reconcile rồi resume có kiểm tra trùng; không thu tiền lại.",
      "verification": "Order được cấp một lần, IP/VM ready và khách sử dụng được.",
      "escalate_when": "Payment integration hoặc queue cần đội quản lý.",
      "production_warning": "Không tạo VM thứ hai thủ công hoặc yêu cầu trả tiền lại khi đã Paid."
    }
  },
  "VPS-14-003": {
    "objective": "Xử lý yêu cầu hủy cuối kỳ, xác nhận đúng owner và thời hạn bảo toàn dữ liệu.",
    "customerExplanation": "Khách muốn hủy VPS vào cuối chu kỳ, không yêu cầu xóa ngay hôm nay. Cần xác nhận mốc và phạm vi hủy.",
    "hints": [
      "Hủy cuối kỳ khác terminate ngay.",
      "So Active until với policy và audit yêu cầu cancellation.",
      "Dịch vụ tới 15/11 và chưa có request được gửi; cần owner xác nhận mốc, backup/export rồi ghi yêu cầu đúng quy trình."
    ],
    "verificationPrompt": "Ghi ngày hết kỳ, yêu cầu owner và thời hạn backup/export. Nêu cách xác nhận request đã ghi đúng ngày mà không xóa ngay dịch vụ.",
    "probes": {
      "P1": {
        "purpose": "Đọc thời hạn dịch vụ đang Active.",
        "why": "Cần mốc cụ thể cho yêu cầu hủy cuối kỳ.",
        "meaning": "Dịch vụ Active until 15/11; không phải đã được lên lịch cancellation."
      },
      "P2": {
        "purpose": "Đọc chính sách hủy cuối kỳ của tình huống.",
        "why": "Xác nhận có cách thực hiện yêu cầu mà không dừng ngay.",
        "meaning": "End-of-term cancellation được hỗ trợ; vẫn cần đúng owner và request hợp lệ."
      },
      "G1": {
        "purpose": "Kiểm tra đã có request cancellation chưa.",
        "why": "Tránh nghĩ ticket này đã tự thực hiện thay đổi billing.",
        "meaning": "Chưa có request cho VPS-1403; cần gửi và xác nhận ngày hiệu lực."
      }
    },
    "questions": {
      "triage": {
        "prompt": "Khách muốn dừng dịch vụ vào lúc nào?",
        "explanation": "Giữ khác biệt giữa yêu cầu theo kỳ và xóa ngay.",
        "options": {
          "symptom": [
            "Hủy ở cuối chu kỳ hiện tại.",
            "Đúng thời điểm khách yêu cầu."
          ],
          "other": [
            "Xóa VPS ngay lập tức hôm nay.",
            "Khác với end of cycle."
          ],
          "cause": [
            "Có thể xóa disk ngay vì đã yêu cầu hủy.",
            "Hủy cuối kỳ không cấp quyền xóa trước ngày hiệu lực."
          ]
        }
      },
      "check": {
        "prompt": "Mục nào xác nhận ngày cuối kỳ hiện tại?",
        "explanation": "Ngày cần lấy từ service, không đoán theo ngày mở ticket.",
        "options": {
          "direct": [
            "BILLING: service",
            "Ghi Active until của dịch vụ."
          ],
          "wrong1": [
            "PANEL: cancellation policy",
            "Cho cách hủy, không xác định ngày hết kỳ của VPS này."
          ],
          "wrong2": [
            "BILLING: cancellation request audit",
            "Cho request hiện có, không thay kỳ dịch vụ nếu chưa gửi request."
          ]
        }
      },
      "output": {
        "prompt": "Active tới 15/11 và policy cho hủy cuối kỳ. Có thể làm gì?",
        "explanation": "Khả năng hỗ trợ không đồng nghĩa request đã được áp.",
        "options": {
          "supported": [
            "Xác nhận owner rồi ghi hủy đúng cuối kỳ.",
            "Còn phải xác nhận request và kế hoạch dữ liệu."
          ],
          "over": [
            "Yêu cầu này cho phép xóa disk ngay hôm nay.",
            "Ngày hiệu lực tương lai chưa đến."
          ],
          "ignore": [
            "Active nghĩa là không thể gửi cancellation trước 15/11.",
            "Policy cho end-of-term, có thể ghi lịch theo quy trình."
          ]
        }
      },
      "evidence": {
        "prompt": "Chọn hai thông tin service và policy đã xác nhận.",
        "explanation": "Chưa nhầm chính sách hỗ trợ với một request đã gửi.",
        "options": {
          "p1": [
            "Dịch vụ Active tới 15/11.",
            "Đây là mốc kỳ hiện tại."
          ],
          "p2": [
            "Có hỗ trợ end-of-term cancellation.",
            "Policy cho cách hủy theo yêu cầu."
          ],
          "over": [
            "Disk đã được phép xóa ngay.",
            "Không có approval cho terminate tức thời."
          ]
        }
      },
      "decision": {
        "prompt": "Nên ghi yêu cầu cancellation thế nào?",
        "explanation": "Owner cần hiểu phạm vi dữ liệu và ngày hiệu lực trước chấp thuận.",
        "options": {
          "safe": [
            "Ghi yêu cầu hủy cuối chu kỳ.",
            "Giữ dịch vụ tới đúng mốc và có xác nhận bằng văn bản."
          ],
          "unsafe": [
            "Terminate VPS hoặc xóa backup ngay.",
            "Cắt sớm dịch vụ và mất khả năng lấy dữ liệu."
          ],
          "close": [
            "Đóng ticket sau khi chỉ gửi policy.",
            "Chưa xác nhận request đã ghi đúng ngày."
          ]
        }
      }
    },
    "review": {
      "technical": "End-of-term không là immediate deletion; policy không tự tạo request.",
      "editorial": "Câu hỏi tập trung mốc 15/11 và hậu quả dữ liệu.",
      "references": [],
      "fixtureChanges": []
    },
    "answerOverrides": {
      "expected_diagnosis": "Khách xin hủy cuối kỳ; service Active tới 15/11, policy hỗ trợ nhưng chưa có request.",
      "recommended_next_checks": "Xác minh owner, ngày hiệu lực, phạm vi data/backup retention và request state.",
      "resolution_guidance": "Ghi request end-of-term đúng mốc, cho khách thời hạn export/backup; không terminate sớm.",
      "verification": "Có request/date được duyệt, dịch vụ không bị xóa sớm và billing không gia hạn ngoài ý muốn.",
      "escalate_when": "Owner tranh chấp hoặc cần ngoại lệ policy.",
      "production_warning": "Không xóa VM/backup ngay chỉ vì khách xin hủy cuối kỳ."
    }
  },
  "VPS-14-004": {
    "objective": "Xác định điều kiện xét hoàn tiền và đúng người quyết định, không hứa kết quả từ số ngày sử dụng.",
    "customerExplanation": "Khách muốn hoàn tiền sau bảy ngày. Cần xem ngày mua, điều khoản áp dụng và trạng thái yêu cầu.",
    "hints": [
      "Số ngày sử dụng không tự quyết định được refund.",
      "Đọc purchase date, refund policy và request state.",
      "Policy cần review và RF-1404 chưa gửi. Chuyển billing kèm dữ liệu, không hứa 100% hoặc hỏi thẻ trong ticket."
    ],
    "verificationPrompt": "Ghi ngày mua, điều khoản cần xét và request state. Nêu dữ liệu không nhạy cảm cần chuyển billing, quyền quyết định và cách xác nhận kết quả.",
    "probes": {
      "P1": {
        "purpose": "Đọc ngày mua dịch vụ.",
        "why": "Cần mốc để đối chiếu điều khoản refund, không chỉ dựa lời nói bảy ngày.",
        "meaning": "Ngày mua 15/10; riêng ngày này chưa xác định đủ điều kiện hoặc số tiền."
      },
      "P2": {
        "purpose": "Đọc điều kiện xét refund của tình huống.",
        "why": "Không áp một thời hạn hoàn tiền giả định cho mọi gói.",
        "meaning": "Eligibility requires review, no automatic approval: cần review, không có cam kết tự động."
      },
      "G1": {
        "purpose": "Đọc trạng thái request hoàn tiền.",
        "why": "Phân biệt mới hỏi policy với yêu cầu đã được tiếp nhận và phê duyệt.",
        "meaning": "RF-1404 chưa gửi, decision none; chưa có kết quả chính thứ c."
      }
    },
    "questions": {
      "triage": {
        "prompt": "Khách đang đề nghị điều gì?",
        "explanation": "Refund request cần policy review, không tự coi là được duyệt.",
        "options": {
          "symptom": [
            "Xin hoàn tiền sau bảy ngày.",
            "Đúng đề nghị cần tiếp nhận."
          ],
          "other": [
            "Xin hủy vào cuối chu kỳ nhưng không hoàn tiền.",
            "Không đúng yêu cầu hoàn tiền đã nêu."
          ],
          "cause": [
            "Đúng bảy ngày nên refund 100% được bảo đảm.",
            "Chưa đối chiếu điều khoản hoặc quyết định billing."
          ]
        }
      },
      "check": {
        "prompt": "Mục nào xác nhận mốc mua dịch vụ để xét refund?",
        "explanation": "Ngày mua là dữ kiện, không phải quyết định eligibility.",
        "options": {
          "direct": [
            "BILLING: purchased",
            "Cho ngày giao dịch mua của dịch vụ."
          ],
          "wrong1": [
            "PANEL: refund policy",
            "Cho điều kiện xét, không xác định ngày mua cụ thể."
          ],
          "wrong2": [
            "BILLING: refund request state",
            "Cho tiến trình request, không thay ngày mua."
          ]
        }
      },
      "output": {
        "prompt": "Ngày mua đã có nhưng policy cần review. Có thể trả lời gì?",
        "explanation": "Chỉ bên có quyền sau review mới xác nhận đủ điều kiện và số tiền.",
        "options": {
          "supported": [
            "Chưa xác định eligibility; cần billing review.",
            "Ngày mua và policy chưa là quyết định refund."
          ],
          "over": [
            "Tự động hoàn 100% vì đúng bảy ngày.",
            "Policy nêu không automatic approval."
          ],
          "ignore": [
            "Cần từ chối ngay vì chưa có decision.",
            "Chưa có decision nghĩa là cần tiếp nhận review, không tự từ chối."
          ]
        }
      },
      "evidence": {
        "prompt": "Chọn hai điều được purchase record và policy nêu.",
        "explanation": "Không coi thời hạn được nhắc trong ticket là điều khoản đã xác nhận.",
        "options": {
          "p1": [
            "Ngày mua là 15/10.",
            "Đây là dữ kiện để đối chiếu thời gian."
          ],
          "p2": [
            "Eligibility cần review, không tự động approve.",
            "Đây là policy trong tình huống."
          ],
          "over": [
            "Refund 100% đã được phê duyệt.",
            "Request còn chưa gửi, decision none."
          ]
        }
      },
      "decision": {
        "prompt": "Support nên tiếp nhận yêu cầu hoàn tiền thế nào?",
        "explanation": "Không thu thông tin thẻ hoặc dùng quyền support thay quyết định billing.",
        "options": {
          "safe": [
            "Xác minh owner/order rồi chuyển billing xét theo điều khoản.",
            "Chỉ thông báo trạng thái và kết quả được bên có quyền xác nhận."
          ],
          "unsafe": [
            "Tự phát refund hoặc yêu cầu gửi số thẻ qua ticket.",
            "Vượt quyền hoặc làm lộ dữ liệu thanh toán."
          ],
          "close": [
            "Đóng ticket vì đã báo ngày mua.",
            "Khách cần yêu cầu được review và nhận quyết định."
          ]
        }
      }
    },
    "review": {
      "technical": "Không suy eligibility từ 7 ngày; không default approve/deny; request chưa gửi.",
      "editorial": "Phân biệt dữ kiện, điều khoản, quyết định.",
      "references": [],
      "fixtureChanges": []
    },
    "answerOverrides": {
      "expected_diagnosis": "Ngày mua đã có nhưng eligibility cần review; request RF-1404 chưa gửi, decision none.",
      "recommended_next_checks": "Xác minh owner, invoice, ngày mua và điều khoản áp dụng, không thu thông tin thẻ.",
      "resolution_guidance": "Chuyển billing review và báo trạng thái xử lý; không hứa approve hoặc 100%.",
      "verification": "Quyết định bằng văn bản từ bên có quyền, ledger khớp nếu phát sinh refund.",
      "escalate_when": "Billing team quyết định refund hoặc giải quyết tranh chấp.",
      "production_warning": "Bảy ngày không tự tạo quyền refund; không tự phát hoàn tiền."
    }
  },
  "VPS-13-005": {
    "objective": "Phân biệt lookup trong host và container để khoanh vùng đường resolver, không vội đổi DNS toàn hệ thống.",
    "customerExplanation": "Host phân giải được tên nhưng container không được. Cần so cùng hostname và kiểm tra resolver bên trong container.",
    "hints": [
      "Lookup thành công trên host chưa kiểm tra đường DNS của container.",
      "So hai lệnh getent, rồi xem resolv.conf và query tới resolver container.",
      "Container dùng 127.0.0.11 và query timeout; getent rỗng riêng nó chưa định nguyên nhân. Đối chiếu Docker network và upstream trước đổi DNS."
    ],
    "verificationPrompt": "Ghi khác biệt host/container, resolver đang dùng và lỗi query. Nêu giả thuyết còn lại, đội cần xử lý và cách thử DNS lẫnứng dụng sau change.",
    "probes": {
      "P1": {
        "purpose": "Tra tên qua NSS bên trong api.",
        "why": "Cần lặp phép lookup đúng nơi ứng dụng thất bại.",
        "meaning": "Không có entry trả về. getent rỗng chưa phân biệt NXDOMAIN, timeout hay cấu hình NSS."
      },
      "P2": {
        "purpose": "Tra cùng hostname bằng NSS của Docker host.",
        "why": "So phạm vi lỗi với container, tránh quy mọi DNS cho authoritative.",
        "meaning": "Host trả entry cho example.com; không chứng minh resolver/path trong container khỏe.",
        "output": "93.184.215.14  example.com"
      },
      "G1": {
        "purpose": "Đọc cấu hình resolver trong container.",
        "why": "Xác định nơi lookup trong api được gửi tới.",
        "meaning": "nameserver 127.0.0.11 là Docker embedded DNS trong ngữ cảnh network này; cần kiểm tra đường query tới nó và upstream."
      },
      "G2": {
        "purpose": "Thử DNS query từ container.",
        "why": "Bổ sung lỗi cụ thể cho quan sát getent rỗng.",
        "meaning": "Query tới 127.0.0.11 timeout; chưa định lỗi embedded resolver, forwarding hay upstream."
      }
    },
    "questions": {
      "triage": {
        "prompt": "Lỗi phân giải xảy ra ở phạm vi nào khách nêu?",
        "explanation": "Cần so cùng tên ở host và container trước chọn lớp sửa.",
        "options": {
          "symptom": [
            "Container lookup lỗi, host lookup được.",
            "Đúng khác biệt cần tái kiểm tra."
          ],
          "other": [
            "Host và mọi container đều không resolve được.",
            "Khách đã nêu host hoạt động."
          ],
          "cause": [
            "Domain chắc chắn không có record public.",
            "Host lookup thành công và chưa hỏi authoritative."
          ]
        }
      },
      "check": {
        "prompt": "Lệnh nào lặp phép tra example.com trong api?",
        "explanation": "Phép đo cần ở đúng namespace của ứng dụng.",
        "options": {
          "direct": [
            "docker exec api getent hosts example.com",
            "Tra NSS từ container api."
          ],
          "wrong1": [
            "getent hosts example.com",
            "Nếu chạy host thì chưa kiểm tra container."
          ],
          "wrong2": [
            "docker exec api cat /etc/resolv.conf",
            "Đọc cấu hình, không thử lookup có trả entry."
          ]
        }
      },
      "output": {
        "prompt": "Host có entry, container lookup rỗng và DNS query timeout. Điều tra nên tập trung đâu?",
        "explanation": "Kết quả khác nhau khoanh phạm vi nhưng chưa định lỗi duy nhất.",
        "options": {
          "supported": [
            "Resolver hoặc đường DNS của container.",
            "So Docker network, embedded DNS và upstream; không vội đổi toàn host."
          ],
          "over": [
            "Authoritative chắc chắn không cóArecord.",
            "Timeout không là NXDOMAIN; host còn tra được entry."
          ],
          "ignore": [
            "Host lookup được nghĩa là DNS của api cũng đã tốt.",
            "Container có resolver/path riêng cần kiểm tra."
          ]
        }
      },
      "evidence": {
        "prompt": "Chọn hai kết quả trực tiếp của cặp getent.",
        "explanation": "Không diễn giải chuỗi rỗng thành nguyên nhân khi chưa có query bổ sung.",
        "options": {
          "p1": [
            "Trong api, getent không trả entry.",
            "Đây là quan sát lookup thất bại, chưa biết loại lỗi."
          ],
          "p2": [
            "Host trả entry cho example.com.",
            "Cùng hostname lookup được ở host."
          ],
          "over": [
            "Public authoritative đã xác nhận không có A.",
            "Không có phép hỏi authority trong cặp getent."
          ]
        }
      },
      "decision": {
        "prompt": "Nên sửa DNS container theo hướng nào?",
        "explanation": "Cần khoanh lớp và owner trước thay cấu hình diện rộng.",
        "options": {
          "safe": [
            "Đối chiếu resolver/network và nhờ owner/infra sửa đúng phạm vi.",
            "Giữ cấu hình cũ để rollback và thử lại trong api."
          ],
          "unsafe": [
            "Đổi DNS host rồi restart toàn bộ container ngay.",
            "Có thể làm hỏng dịch vụ khác mà chưa biết nguồn."
          ],
          "close": [
            "Đóng ticket vì host đã resolve được.",
            "Triệu chứng trong container vẫn chưa được xác minh."
          ]
        }
      },
      "order": {
        "prompt": "Sắp xếp điều tra DNS chỉ lỗi trong container.",
        "explanation": "Đo phạm vi trước, change đúng lớp sau, thử lại ứng dụng cuối.",
        "options": {
          "evidence": [
            "So cùng hostname, đọc NSS/resolver và query từ container.",
            "Giữ phân biệt entry rỗng với DNS status."
          ],
          "verify": [
            "Thử lookup và endpoint trong container, kiểm tra phạm vi bị ảnh hưởng.",
            "DNS trả lời chưa chứng minh ứng dụng dùng được."
          ],
          "act": [
            "Owner/infra áp change resolver/network đã được duyệt.",
            "Không đổi cả host nếu lỗi được khoanh ở container."
          ]
        }
      }
    },
    "review": {
      "technical": "getent dùng NSS, không chỉ DNS; rỗng chưa NXDOMAIN; sửa host entry format thêm hostname.",
      "editorial": "Prompt dùng scope host/container và giới hạn kết luận.",
      "references": [
        "https://man7.org/linux/man-pages/man1/getent.1.html",
        "https://docs.docker.com/engine/network/#dns-services"
      ],
      "fixtureChanges": [
        {
          "probeId": "P2",
          "reason": "getent hosts entry cần IP và hostname, source chỉ IP; thêm example.com không thay đổi kết quả lookup.",
          "reference": "https://man7.org/linux/man-pages/man1/getent.1.html"
        }
      ]
    },
    "answerOverrides": {
      "expected_diagnosis": "Host có NSS entry, container không trả entry; query bổ sung tới 127.0.0.11 timeout. Lỗi được khoanh ở resolver/path của container.",
      "recommended_next_checks": "So resolv.conf, NSS, Docker network, embedded DNS và upstream reachability theo cùng hostname/timestamp.",
      "resolution_guidance": "Owner/infra sửa đúng lớp DNS/network được xác minh theo change, không đổi toàn host theo suy đoán.",
      "verification": "Lookup và endpoint ứng dụng trong container hoạt động; host/container khác không bị ảnh hưởng.",
      "escalate_when": "Cần quyền Docker engine hoặc lỗi upstream/path ngoài container.",
      "production_warning": "getent rỗng không tự là NXDOMAIN; không restart mọi container hoặc thay DNS toàn host để thử."
    }
  },
  "VPS-13-007": {
    "objective": "Đọc trạng thái từng service trong Compose, đối chiếu lỗi RAM của DB và bảo vệ volume trước recovery.",
    "customerExplanation": "Container API còn chạy nhưng truy vấn DB lỗi. Cần xem DB riêng, chứ không coi API Up là toàn stack khỏe.",
    "hints": [
      "Mỗi service trong stack có trạng thái riêng.",
      "Dùng compose ps --all để thấy cả service đã dừng; đọc log db và memory limit.",
      "DB Exited, memory allocation error và OOMKilled true hỗ trợ điều tra RAM; host snapshot chưa cho peak và data integrity vẫn phải kiểm tra."
    ],
    "verificationPrompt": "Ghi trạng thái api và db, log memory, limit và host available. Nêu DB owner, volume cần bảo vệ và kiểm tra database/ứng dụng sau recovery.",
    "probes": {
      "P1": {
        "purpose": "Liệt kê cả service chạy và dừng của Compose.",
        "why": "API Up có thể che việc DB đã dừng, trong khi mặc định ps chỉ hiện running.",
        "meaning": "API Up còn db Exited(1); trạng thái API không xác nhận kết nối DB.",
        "command": "docker compose ps --all",
        "output": "NAME   IMAGE        COMMAND                  SERVICE   CREATED         STATUS                     PORTS\napi    api:v2.0     \"python app.py\"          api       5 minutes ago   Up 2 minutes\ndb     mariadb:11   \"docker-entrypoint.sh\"   db        5 minutes ago   Exited (1) 2 minutes ago"
      },
      "P2": {
        "purpose": "Đọc log service DB trong Compose.",
        "why": "Cần biết DB thất bại ở bước nào trước restart API.",
        "meaning": "InnoDB Cannot allocate memory chỉ hướng memory allocation; chưa tách limit container và áp lực RAM host."
      },
      "G1": {
        "purpose": "Đọc OOM event và memory limit của db.",
        "why": "So lỗi InnoDB với giới hạn thực áp lên container.",
        "meaning": "OOMKilled true và limit 1073741824 byte=1 GiB; chưa biết peak hoặc DB settings gây demand cao."
      },
      "G2": {
        "purpose": "Đọc RAM available của Docker host.",
        "why": "Đánh giá capacity trước cân nhắc tăng limit DB.",
        "meaning": "Available 700 MiB trong snapshot, không phải RAM đảm bảo dành riêng cho DB hoặc peak.",
        "output": "               total        used        free      shared  buff/cache   available\nMem:           4.0Gi       2.7Gi       400Mi       100Mi       900Mi       700Mi\nSwap:             0B          0B          0B"
      }
    },
    "questions": {
      "triage": {
        "prompt": "Phần nào của ứng dụng còn chạy nhưng chưa đủ chứng minh dịch vụ khỏe?",
        "explanation": "Cần theo dõi dependency DB, không chỉ trạng thái API.",
        "options": {
          "symptom": [
            "API chạy nhưng truy vấn DB thất bại.",
            "Đúng triệu chứng khách báo."
          ],
          "other": [
            "Toàn Docker host đã tắt.",
            "API còn chạy, khách chưa nêu hostoff."
          ],
          "cause": [
            "API Up chứng minh DB cũng healthy.",
            "Service khác nhau có trạng thái riêng."
          ]
        }
      },
      "check": {
        "prompt": "Lệnh nào thấy cả DB đã dừng trong Compose project?",
        "explanation": "Mặc định compose ps chỉ hiện running; cần--all khi tìm dependency đã thoát.",
        "options": {
          "direct": [
            "docker compose ps --all",
            "Bao gồm container dừng như db."
          ],
          "wrong1": [
            "docker compose ps",
            "Mặc định có thể không hiện DB đã Exited."
          ],
          "wrong2": [
            "docker stats --no-stream",
            "Snapshot resource không thay danh sách service đã dừng."
          ]
        }
      },
      "output": {
        "prompt": "DB Exited, InnoDB lỗi RAM và OOM event. Hướng điều tra nào phù hợp?",
        "explanation": "Chưa chọn ngay tăng RAM host khi chưa kiểm tra limit và DB settings.",
        "options": {
          "supported": [
            "Đối chiếu memory limit DB, host RAM và tải thực.",
            "Dữ liệu hỗ trợ memory issue, chưa lượng hóa giải pháp."
          ],
          "over": [
            "Tăng RAM guest chắc chắn sửa được InnoDB.",
            "Còn limit container, DB configuration và integrity cần xem."
          ],
          "ignore": [
            "Restart API đủ vì API vẫn Up.",
            "DB dependency đang dừng; restart API không cấp thêm RAM cho DB."
          ]
        }
      },
      "evidence": {
        "prompt": "Chọn hai quan sát trong Compose ps và log DB.",
        "explanation": "Không suy toàn stack khỏe từ API Up.",
        "options": {
          "p1": [
            "API Up nhưng db Exited(1).",
            "Đọc được vì đã dùng--all."
          ],
          "p2": [
            "Log DB ghi Cannot allocate memory.",
            "Đây là lỗi cần đối chiếu memory limit/host."
          ],
          "over": [
            "Nâng RAM host là giải pháp đã được kiểm thử.",
            "Chưa có change hoặc kết quả verify."
          ]
        }
      },
      "decision": {
        "prompt": "Nên khôi phục dịch vụ DB theo hướng nào?",
        "explanation": "Bảo vệ dữ liệu DB và điều tra tài nguyên trước recovery.",
        "options": {
          "safe": [
            "Nhờ DB/infra đánh giá RAM và dữ liệu.",
            "Không xóa dữ liệu để chữa allocation error."
          ],
          "unsafe": [
            "Xóa volume DB rồi restart stack cho sạch.",
            "Mất dữ liệu, không giải quyết nguyên nhân tài nguyên."
          ],
          "close": [
            "Đóng ticket vì API container Up.",
            "Khách vẫn không truy vấn được DB."
          ]
        }
      },
      "order": {
        "prompt": "Sắp xếp recovery khi DB container lỗi bộ nhớ.",
        "explanation": "Trạng thái và dữ liệu trước, change đúng owner sau, chức năng DB/API cuối.",
        "options": {
          "evidence": [
            "So Compose all, log DB, OOM/limit, host RAM và volume health.",
            "Xác định dependency và rủi ro dữ liệu."
          ],
          "verify": [
            "Kiểm tra DB integrity, query và API health dưới tải phù hợp.",
            "DB Up riêng chưa xác minh dữ liệu và dịch vụ."
          ],
          "act": [
            "DB/infra owner áp phương án recovery tài nguyên được duyệt.",
            "Chỉ thay đổi sau đánh giá capacity, dữ liệu và rollback."
          ]
        }
      }
    },
    "review": {
      "technical": "Sửa Compose ps cần--all để show DB Exited; OOM snapshot không chứng minh host RAM sole cause; chuẩn hóa free header.",
      "editorial": "Tách API db dependency, không cho API Up=resolved.",
      "references": [
        "https://docs.docker.com/reference/cli/docker/compose/ps/",
        "https://docs.docker.com/engine/containers/resource_constraints/"
      ],
      "fixtureChanges": [
        {
          "probeId": "P1",
          "reason": "Compose ps mặc định chỉ running; dùng--all và bảng đủ cột để hiện db Exited, không alias lệnh cũ sai.",
          "reference": "https://docs.docker.com/reference/cli/docker/compose/ps/"
        },
        {
          "probeId": "G2",
          "reason": "Thêm header free -h, giữ các số liệu RAM/Swap cũ.",
          "reference": "https://man7.org/linux/man-pages/man1/free.1.html"
        }
      ]
    },
    "answerOverrides": {
      "expected_diagnosis": "API Up nhưng DB Exited; InnoDB allocation error, OOMKilled true và limit 1 GiB hỗ trợ điều tra bộ nhớ. Chưa xác nhận nguyên nhân duy nhất.",
      "recommended_next_checks": "So memory timeline, limit, DB settings, host headroom và integrity/backup của volume DB.",
      "resolution_guidance": "DB/infra owner lập recovery/tuning có phê duyệt; bảo vệ volume trước restart/change.",
      "verification": "DB integrity/query và API functional tests đạt dưới tải phù hợp, không tái OOM.",
      "escalate_when": "Production database, dữ liệu hoặc host capacity cần DB/infra cùng xử lý.",
      "production_warning": "Không xóa DB volume hoặc restart loop để bỏ lỗi allocation."
    }
  },
  "VPS-13-008": {
    "objective": "Đối chiếu image và config sau release, kiểm tra data migration trước rollback.",
    "customerExplanation": "API lỗi ngay sau deploy mới. Cần so image/config với bản trước, nhưng chưa được đổi ngược tag mù.",
    "hints": [
      "Deploy mới là đầu mối, timing không tự chứng minh mọi lỗi do image.",
      "So log unknown config với deployment history và image digest.",
      "v2 bỏ legacyMode còn trạng thái migration data unknown. Rollback cần tương thích data, chưa chỉ đổi tag."
    ],
    "verificationPrompt": "Ghi lỗi config, image/tag/digest và điều chưa biết về data migration. Nêu owner sửa/rollback và kiểm tra chức năng dữ liệu sau change.",
    "probes": {
      "P1": {
        "purpose": "Đọc log khởi động API sau deploy.",
        "why": "Tìm lỗi cụ thể của bản vừa triển khai.",
        "meaning": "unknown config option legacyMode hỗ trợ config không được release hiện tại chấp nhận; chưa nói được migration data."
      },
      "P2": {
        "purpose": "Đọc lịch sử thay image tag.",
        "why": "So thời gian lỗi với bản vừa chuyển.",
        "meaning": "Tag đổi v1.8 sang v2.0; tag không thay image digest để xác định artifact thực."
      },
      "G1": {
        "purpose": "Đọc image ID container đang dùng.",
        "why": "Xác định đúng artifact chứ không chỉ tin một tag có thể đổi.",
        "meaning": "Có sha256 image ID cụ thể để đối chiếu release và last known-good; chưa đánh giá chất lượng image."
      },
      "G2": {
        "purpose": "Đọc thay đổi config và trạng thái migration.",
        "why": "Đánh giá rollback có đọc tương thích data hiện tại không.",
        "meaning": "v2.0 bỏ legacyMode, migration status unknown; chưa thể hứa rollback v1.8 an toàn."
      }
    },
    "questions": {
      "triage": {
        "prompt": "Khách liên hệ API hỏng với sự kiện nào?",
        "explanation": "Cần xác nhận thay đổi và lỗi cụ thể trước chọn rollback.",
        "options": {
          "symptom": [
            "API hỏng ngay sau bản triển khai mới.",
            "Đúng mốc bắt đầu điều tra."
          ],
          "other": [
            "Chỉ DNS domain chưa được cập nhật.",
            "Khách không nêu DNS và chưa có phép đo DNS."
          ],
          "cause": [
            "Rollback tag cũ chắc chắn an toàn.",
            "Chưa biết data schema/migration hiện tại."
          ]
        }
      },
      "check": {
        "prompt": "Lệnh nào đọc lỗi của API vừa deploy?",
        "explanation": "Log giúp bám triệu chứng thay vì chỉ suy từ tag.",
        "options": {
          "direct": [
            "docker logs api --tail 20",
            "Đọc log đúng container api."
          ],
          "wrong1": [
            "docker inspect api --format \"{{.Image}}\"",
            "Cho image ID, không cho thông báo lỗi ứng dụng."
          ],
          "wrong2": [
            "PANEL: deployments",
            "Cho thay đổi release, không thay log lỗi cụ thể."
          ]
        }
      },
      "output": {
        "prompt": "Lỗi unknown legacyMode đi kèm đổi v2.0. Điều gì cần xác minh?",
        "explanation": "Có hướng config/release incompatibility, nhưng rollback cần tương thích data.",
        "options": {
          "supported": [
            "Đối chiếu release/config và data migration.",
            "Lỗi và release notes phù hợp; chưaduệtmộtphươngánrollback."
          ],
          "over": [
            "Đổi tag về v1.8 không cần kiểm tra data.",
            "Migration unknown có thể khiến image cũ không đọc dữ liệu mới."
          ],
          "ignore": [
            "Chỉ restart v2.0 sẽ tự hỗ trợ legacyMode.",
            "Restart không thêm config option đã bị bỏ."
          ]
        }
      },
      "evidence": {
        "prompt": "Chọn hai điều log và deploy history cho biết.",
        "explanation": "Đừng đồng nhất thay tag với quyền rollback.",
        "options": {
          "p1": [
            "Log báo unknown config option legacyMode.",
            "Option này không được app hiện tại chấp nhận."
          ],
          "p2": [
            "Tag đã chuyển v1.8 sang v2.0.",
            "Đây là thay đổi release cần đối chiếu."
          ],
          "over": [
            "Bản cũ chắc chắn tương thích data sau upgrade.",
            "Chưa có kiểm định migration/compatibility."
          ]
        }
      },
      "decision": {
        "prompt": "Nên chọn sửa config hay rollback thế nào?",
        "explanation": "Owner quyết định sau thu artifact, changelog và dữ liệu migration.",
        "options": {
          "safe": [
            "Lập change config/rollback sau kiểm định.",
            "Có phương án bảo vệ data và verify chức năng."
          ],
          "unsafe": [
            "Xóa container/volume và pull latest để thử.",
            "Có thể mất dữ liệu và đưa vào một artifact chưa biết."
          ],
          "close": [
            "Đóng ticket vì tag đã đổi về cũ.",
            "Chưa xác minh API hoặc tương thích dữ liệu."
          ]
        }
      },
      "order": {
        "prompt": "Sắp xếp xử lý API hỏng sau release.",
        "explanation": "Tìm lỗi và compatibility trước, change được duyệt sau, kiểm tra chức năng cuối.",
        "options": {
          "evidence": [
            "So log, digest, release changes và data migration.",
            "Biết đúng artifact và giới hạn rollback."
          ],
          "verify": [
            "Chạy health/functional tests và đối chiếu dữ liệu ứng dụng.",
            "Container Up không xác nhận release đã đáp ứng."
          ],
          "act": [
            "Owner áp config fix hoặc rollback theo kế hoạch được kiểm thử.",
            "Quyết định có tính đến schema/data hiện tại."
          ]
        }
      }
    },
    "review": {
      "technical": "Tag không là immutable artifact; data migration unknown chặn cam kết rollback.",
      "editorial": "Các câu tách correlation, config error, release compatibility.",
      "references": [
        "https://docs.docker.com/reference/cli/docker/container/inspect/"
      ],
      "fixtureChanges": []
    },
    "answerOverrides": {
      "expected_diagnosis": "Sau đổi image v1.8 sang v2.0, app báo legacyMode không được chấp nhận; release notes phù hợp, lịch migration data chưa rõ.",
      "recommended_next_checks": "So đúng digest, config, changelog, last-known-good và data/schema migration.",
      "resolution_guidance": "Owner duyệt config fix hoặc rollback chỉ sau kiểm tra tương thích data và kế hoạch khôi phục.",
      "verification": "Health/functional tests và dữ liệu ứng dụng đúng, không chỉ container Up hoặc đổi tag.",
      "escalate_when": "Cần app/vendor/DB owner quyết định compatibility hoặc migration.",
      "production_warning": "Tag có thể đổi; không xóa volume hoặc rollback mù khi migration unknown."
    }
  },
  "VPS-13-001": {
    "objective": "Đọc container đã dừng và lỗi import trước khi chọn hướng sửa bản triển khai.",
    "customerExplanation": "Ứng dụng Docker không truy cập được. Trước hết cần biết container còn chạy không và ứng dụng ghi lỗi gì.",
    "hints": [
      "Ứng dụng offline chưa chứng minh Docker daemon bị hỏng.",
      "docker ps -a có cả container dừng; đọc log đúng container api.",
      "Exit code 1 và lỗi import appconfig dẫn tới kiểm tra dependency/image. Không xóa volume để sửa thiếu module."
    ],
    "verificationPrompt": "Ghi trạng thái api, lỗi import và bản triển khai liên quan. Nêu owner sửa image/dependency và cách kiểm tra container ổn định, endpoint cùng dữ liệu.",
    "probes": {
      "P1": {
        "purpose": "Liệt kê container đang chạy và đã dừng.",
        "why": "Cần xác nhận api có còn process trước điều tra endpoint.",
        "meaning": "api Exited (1) nghĩa là đã thoát với mã lỗi; chưa cho biết nguyên nhân Docker hay ứng dụng.",
        "output": "CONTAINER ID   IMAGE      COMMAND            CREATED         STATUS                     PORTS   NAMES\na4c21d02f881   api:v2.0   \"python app.py\"    5 minutes ago   Exited (1) 2 minutes ago           api"
      },
      "P2": {
        "purpose": "Đọc 20 dòng log cuối của api.",
        "why": "Exit code chỉ báo lỗi chung; log giúp xác định bước khởi động ứng dụng thất bại.",
        "meaning": "Python không import được appconfig; cần đối chiếu dependency và image đang dùng.",
        "output": "ModuleNotFoundError: No module named 'appconfig'"
      },
      "G1": {
        "purpose": "Đọc manifest release của api.",
        "why": "So dependency được build với module log đang báo thiếu.",
        "meaning": "Manifest ghi appconfig bị thiếu ở release v2.0, phù hợp lỗi import; chưa có kết quả sau redeploy."
      }
    },
    "questions": {
      "triage": {
        "prompt": "Khách báo trạng thái nào của ứng dụng?",
        "explanation": "Offline là triệu chứng; cần kiểm tra container và log để định lớp lỗi.",
        "options": {
          "symptom": [
            "Ứng dụng Docker không hoạt động.",
            "Đây là điều khách cần kiểm tra."
          ],
          "other": [
            "Panel đã xác nhận VM bị tắt.",
            "Khách chưa cung cấp VM state."
          ],
          "cause": [
            "Docker daemon chắc chắn đã hỏng.",
            "Chưa đọc trạng thái daemon, container hoặc log ứng dụng."
          ]
        }
      },
      "check": {
        "prompt": "Lệnh nào còn liệt kê api nếu nó đã dừng?",
        "explanation": "docker ps mặc định chỉ hiện container chạy; -a bao gồm container dừng.",
        "options": {
          "direct": [
            "docker ps -a",
            "Có thể nhìn thấy api ở trạng thái Exited."
          ],
          "wrong1": [
            "docker ps",
            "Có thể bỏ qua api vì nó đã dừng."
          ],
          "wrong2": [
            "docker stats --no-stream",
            "Đo tài nguyên không thay danh sách container dừng và exit status."
          ]
        }
      },
      "output": {
        "prompt": "api Exited (1), log báo thiếu appconfig. Hướng điều tra nào có căn cứ?",
        "explanation": "Lỗi import hướng tới bản ứng dụng; chưa quy hỏng Docker daemon.",
        "options": {
          "supported": [
            "Kiểm tra dependency của image api.",
            "Log xác định import thất bại; manifest và release cần được đối chiếu."
          ],
          "over": [
            "Docker daemon hỏng nên phải cài lại host.",
            "Docker vẫn liệt kê và đọc log; chưa có bằng chứng daemon hỏng."
          ],
          "ignore": [
            "Exit code 1 đã đủ để chỉ restart liên tục.",
            "Mã lỗi chung không sửa module thiếu trong image."
          ]
        }
      },
      "evidence": {
        "prompt": "Chọn hai điều trạng thái và log trực tiếp cho thấy.",
        "explanation": "Ghi kết quả trước, không biến nó thành quyền xóa dữ liệu.",
        "options": {
          "p1": [
            "api đã Exited với mã 1.",
            "Đọc từ danh sách container."
          ],
          "p2": [
            "Python không import được appconfig.",
            "Đọc từ log container."
          ],
          "over": [
            "Docker daemon host chắc chắn hỏng.",
            "Hai kết quả này chưa đo lỗi daemon."
          ]
        }
      },
      "decision": {
        "prompt": "Nên sửa lỗi thiếu module theo hướng nào?",
        "explanation": "Dependency thuộc build/deploy của ứng dụng; giữ volume dữ liệu.",
        "options": {
          "safe": [
            "Nhờ owner sửa image/dependency và redeploy có duyệt.",
            "Đối chiếu digest/manifest, giữ rollback rồi kiểm tra endpoint."
          ],
          "unsafe": [
            "Xóa volume rồi tạo lại container để hết lỗi.",
            "Volume dữ liệu không cung cấp module bị thiếu trong image."
          ],
          "close": [
            "Đóng ticket khi container được tạo lại, chưa thử endpoint.",
            "Container tồn tại không chứng minh ứng dụng khởi động và đáp ứng."
          ]
        }
      }
    },
    "review": {
      "technical": "Chuẩn hóa docker ps và Python exception, không xem exit 1 là daemon corruption.",
      "editorial": "Câu riêng về api/appconfig; đúng label ngắn, giải thích ở feedback.",
      "references": [
        "https://docs.docker.com/reference/cli/docker/container/ls/",
        "https://docs.python.org/3/library/exceptions.html#ModuleNotFoundError"
      ],
      "fixtureChanges": [
        {
          "probeId": "P1",
          "reason": "Thay câu api Exited bằng bảng docker ps -a, giữ container/exit status.",
          "reference": "https://docs.docker.com/reference/cli/docker/container/ls/"
        },
        {
          "probeId": "P2",
          "reason": "Dùng dạng thông báo Python missing module chuẩn cho cùng appconfig.",
          "reference": "https://docs.python.org/3/library/exceptions.html#ModuleNotFoundError"
        }
      ]
    },
    "answerOverrides": {
      "expected_diagnosis": "api đã Exited(1); log Python không import được appconfig, manifest ghi dependency này thiếu trong release v2.0.",
      "recommended_next_checks": "So image digest, manifest, runtime và lần deploy; xác nhận app owner cùng rollback đã biết.",
      "resolution_guidance": "Owner sửa build/dependency rồi redeploy được duyệt, giữ volume và cấu hình cần thiết.",
      "verification": "Container ổn định, không còn import error và endpoint chức năng đáp ứng từ client.",
      "escalate_when": "Ứng dụng do khách/vendor quản lý hoặc cần change deployment ngoài quyền support.",
      "production_warning": "Không xóa volume hoặc restart loop để chữa module thiếu trong image."
    }
  },
  "VPS-13-002": {
    "objective": "Phân biệt cổng trong container và cổng được publish ra VPS.",
    "customerExplanation": "Ứng dụng truy cập được trong container nhưng không mở được qua IP của VPS. Cần kiểm tra Docker có publish cổng ra host hay ứng dụng chỉ được truy cập qua reverse proxy.",
    "hints": [
      "Port ghi trong container không nhất thiết đã được map ra host.",
      "So PORTS trong docker ps với docker port và PortBindings.",
      "8080/tcp không có host mapping; docker port rỗng và PortBindings {}. Xác nhận thiết kế private/proxy trước mở public."
    ],
    "verificationPrompt": "Ghi cổng trong container, cổng đã publish (nếu có), và kết quả PortBindings. Xác nhận ứng dụng cần public hay chỉ qua proxy; nêu bước xử lý được chủ VPS duyệt và cách kiểm tra từ client.",
    "probes": {
      "P1": {
        "purpose": "Đọc tên và thông tin port của container.",
        "why": "Cần biết Docker có hiển thị mapping host:port cho web không.",
        "meaning": "web 8080/tcp chỉ ghi port container, không có dạng host:port->container:port."
      },
      "P2": {
        "purpose": "Liệt kê port mapping của web.",
        "why": "Kiểm tra trực tiếp có published port nào không.",
        "meaning": "Không có output mapping. Kết hợp PortBindings để phân biệt không publish với thiết kế proxy hoặc network mode khác."
      },
      "G1": {
        "purpose": "Đọc HostConfig.PortBindings của web.",
        "why": "Xác nhận metadata publish thay vì chỉ dựa dòng PORTS.",
        "meaning": "{} là map rỗng, không có cấu hình binding ở đây; chưa nói app lắng nghe hay định public hay private."
      }
    },
    "questions": {
      "triage": {
        "prompt": "Hai nơi truy cập nào cho kết quả khác nhau?",
        "explanation": "Ứng dụng hoạt động trong container không đồng nghĩa VPS đã có cổng hoặc proxy để client bên ngoài truy cập.",
        "options": {
          "symptom": [
            "Trong container được, qua IP VPS không được.",
            "Đường nội bộ đã hoạt động; phải kiểm tra cổng publish hoặc reverse proxy trên VPS."
          ],
          "other": [
            "Ứng dụng lỗi HTTP 500 ngay trong container.",
            "Khách xác nhận bên trong hoạt động."
          ],
          "cause": [
            "Chắc chắn firewall provider đang chặn port.",
            "Chưa kiểm tra host mapping hoặc đường proxy."
          ]
        }
      },
      "check": {
        "prompt": "Lệnh nào xem dòng PORTS của web trong danh sách container?",
        "explanation": "Dòng PORTS giúp phân biệt port container với mapping của host.",
        "options": {
          "direct": [
            "docker ps --format \"{{.Names}} {{.Ports}}\"",
            "Hiển thị tên container và cột PORTS, giúp thấy container port có được ánh xạ sang host port hay không."
          ],
          "wrong1": [
            "docker exec web ss -ltnp",
            "Cho biết ứng dụng có lắng nghe trong container; không cho biết Docker publish cổng ra host như thế nào."
          ],
          "wrong2": [
            "ss -ltnp",
            "Xem socket trên host, nhưng không thay thế được thông tin mapping do Docker quản lý."
          ]
        }
      },
      "output": {
        "prompt": "Chỉ thấy 8080/tcp và docker port rỗng. Điều gì còn thiếu trong cấu hình đang thấy?",
        "explanation": "EXPOSE chỉ mô tả cổng ứng dụng trong container. Cần Docker publish hoặc một proxy phù hợp thì client mới có đường truy cập từ bên ngoài.",
        "options": {
          "supported": [
            "Chưa có published host port được ghi nhận.",
            "Dòng PORTS không có host port và PortBindings rỗng đều cho thấy chưa cấu hình publish. Vẫn phải xác nhận ứng dụng có cần public hay không."
          ],
          "over": [
            "EXPOSE 8080 đã tự mở public port trên VPS.",
            "EXPOSE không tự mở cổng ở VPS và không tạo host-port mapping."
          ],
          "ignore": [
            "App bên trong chạy được nghĩa là đường ngoài đã đúng.",
            "Ứng dụng có thể chỉ nhận kết nối từ container network; client ngoài VPS cần đường publish hoặc proxy riêng."
          ]
        }
      },
      "evidence": {
        "prompt": "Chọn hai kết quả về mapping được Docker trả về.",
        "explanation": "Không có host-port mapping cũng là kết quả cần ghi nhận. Đọc cùng cột PORTS và PortBindings để xác nhận.",
        "options": {
          "p1": [
            "PORTS chỉ ghi 8080/tcp.",
            "Chỉ thấy cổng container 8080/tcp, chưa thấy host IP:port được publish."
          ],
          "p2": [
            "docker port web không in mapping.",
            "Lệnh không trả về cổng host nào được publish cho container web."
          ],
          "over": [
            "EXPOSE tự mở firewall public.",
            "Không được hai phép đọc hỗ trợ."
          ]
        }
      },
      "decision": {
        "prompt": "Trước khi publish 8080 ra host, nên xác nhận điều gì?",
        "explanation": "Publish cổng có thể đưa ứng dụng nội bộ ra Internet. Phải xác nhận thiết kế truy cập và quyền thay đổi trước.",
        "options": {
          "safe": [
            "Xác nhận kiến trúc và owner, dùng proxy/publish được duyệt.",
            "Chủ VPS cần xác nhận interface, firewall/ACL và HTTPS hoặc reverse proxy; sau đó kiểm tra endpoint từ client."
          ],
          "unsafe": [
            "Publish 0.0.0.0:8080 và mở firewall rộng ngay.",
            "Bind 0.0.0.0 có thể mở dịch vụ tới tất cả interface; ứng dụng nội bộ có thể bị truy cập ngoài dự kiến."
          ],
          "close": [
            "Đóng ticket vì app trong container đã chạy.",
            "Ticket chưa được giải quyết vì người dùng vẫn không truy cập được ứng dụng qua đường dự kiến."
          ]
        }
      }
    },
    "review": {
      "technical": "Giữ rỗng stdout thật; EXPOSE khác publish, PortBindings không suy app health.",
      "editorial": "Ba lớp container–host–proxy có câu và distractor riêng.",
      "references": [
        "https://docs.docker.com/engine/network/port-publishing/",
        "https://docs.docker.com/reference/cli/docker/container/port/"
      ],
      "fixtureChanges": []
    },
    "answerOverrides": {
      "expected_diagnosis": "PORTS chỉ có 8080/tcp, docker port rỗng và PortBindings{}; chưa thấy host port publish.",
      "recommended_next_checks": "So network mode, listener ứng dụng, proxy và yêu cầu public/private với owner.",
      "resolution_guidance": "Dùng proxy hoặc publish đúng interface theo change có ACL/TLS, không expose mù.",
      "verification": "Đúng endpoint host/public truy cập được theo thiết kế, không lộ port ngoài phạm vi.",
      "escalate_when": "Cần thay đổi Docker host/provider firewall hoặc kiến trúc chưa rõ.",
      "production_warning": "EXPOSE không tự publish; mở public có thể làm lộ backend vốn private."
    }
  },
  "VPS-13-003": {
    "objective": "Đọc binding loopback của port publish và xác nhận thiết kế reverse proxy trước đổi interface.",
    "customerExplanation": "Ứng dụng mở được qua 127.0.0.1 trên host nhưng không từ bên ngoài. Cần kiểm tra địa chỉ mà Docker publish.",
    "hints": [
      "127.0.0.1 là loopback của host, khác địa chỉ ngoài của VPS.",
      "So docker port với local curl và listener 8080.",
      "Mapping 127.0.0.1:8080 giới hạn đường vào; chưa biết đó là chủ ý dùng proxy hay cấu hình sai."
    ],
    "verificationPrompt": "Ghi binding, kết quả local HTTP và yêu cầu endpoint bên ngoài. Nêu phương án proxy/bind có quyền và cách kiểm tra truy cập đúng phạm vi.",
    "probes": {
      "P1": {
        "purpose": "Đọc IP/port host của mapping web.",
        "why": "Local được còn ngoài không được có thể liên quan địa chỉ bind.",
        "meaning": "8080/tcp map tới 127.0.0.1:8080, không phải bind trên mọi IP host. Chưa biết chủ ý kiến trúc."
      },
      "P2": {
        "purpose": "Đọc HTTP headers qua loopback host.",
        "why": "Xác nhận đường local thực sự tới được HTTP ở 8080.",
        "meaning": "HTTP 200 xác nhận request local nhận phản hồi; không kiểm tra đường public hoặc nội dung chức năng đầy đủ."
      },
      "G1": {
        "purpose": "Đọc socket lắng nghe 8080 trên host.",
        "why": "Đối chiếu mapping Docker với listener thực tế.",
        "meaning": "Socket ở 127.0.0.1:8080 phù hợp binding loopback. Mở firewall không tự đổi địa chỉ bind."
      }
    },
    "questions": {
      "triage": {
        "prompt": "Khách kết nối được ở đâu?",
        "explanation": "Localhost và IP bên ngoài là hai đường truy cập khác nhau.",
        "options": {
          "symptom": [
            "Host loopback được, truy cập ngoài không được.",
            "Cần xem binding/proxy và đường ngoài."
          ],
          "other": [
            "Localhost cũng báo connection refused.",
            "Khách nói đường local hoạt động."
          ],
          "cause": [
            "Chắc chắn chỉ firewall chặn public.",
            "Chưa xem địa chỉ bind của mapping."
          ]
        }
      },
      "check": {
        "prompt": "Lệnh nào cho IP host mà port 8080 đang được publish tới?",
        "explanation": "Mapping cần được đọc trước khi đề xuất mở firewall.",
        "options": {
          "direct": [
            "docker port web",
            "In rõ IP host của published port."
          ],
          "wrong1": [
            "curl -I http://127.0.0.1:8080",
            "Thử local HTTP, không liệt kê toàn bộ mapping."
          ],
          "wrong2": [
            "docker exec web ip route",
            "Route trong container không nói host binding."
          ]
        }
      },
      "output": {
        "prompt": "Mapping ở127.0.0.1 và local curl 200. Kết luận nào phù hợp?",
        "explanation": "Địa chỉ loopback giải thích giới hạn đường vào; ý định thiết kế còn phải xác nhận.",
        "options": {
          "supported": [
            "Mapping hiện chỉ ở loopback; cần xác nhận proxy/public design.",
            "Chưa tự khẳng định đây là lỗi hoặc được phép đổi bind."
          ],
          "over": [
            "Mở firewall là đủ dù socket vẫn chỉ loopback.",
            "Firewall không chuyển listener sang IP public."
          ],
          "ignore": [
            "Local 200 chứng minh public endpoint đã hoạt động.",
            "Request này chưa đi qua đường ngoài của khách."
          ]
        }
      },
      "evidence": {
        "prompt": "Chọn hai kết quả đã được quan sát.",
        "explanation": "Mapping và local HTTP không tự xác nhận quyền phơi ứng dụng ra ngoài.",
        "options": {
          "p1": [
            "Host mapping là 127.0.0.1:8080.",
            "Đọc từ docker port."
          ],
          "p2": [
            "Local curl nhận HTTP 200.",
            "Chỉ kiểm chứng request qua loopback."
          ],
          "over": [
            "Firewall change tự chuyển binding sang public.",
            "Không có thao tác đổi bind trong phép đọc này."
          ]
        }
      },
      "decision": {
        "prompt": "Nên mở đường ngoài thế nào khi chưa biết thiết kế bảo mật?",
        "explanation": "Hỏi intended exposure trước, tránh biến backend private thành public.",
        "options": {
          "safe": [
            "Xác nhận owner rồi dùng proxy hoặc bind change có kiểm soát.",
            "Giữ TLS/ACL và chỉ public endpoint được duyệt."
          ],
          "unsafe": [
            "Expose container ra Internet ngay để khách thử.",
            "Có thể bỏ qua proxy/auth vốn là ranh giới bảo vệ."
          ],
          "close": [
            "Đóng ticket vì local curl đã 200.",
            "Đường khách cần từ ngoài chưa được kiểm tra."
          ]
        }
      }
    },
    "review": {
      "technical": "Sửa ý định không được chứng minh: loopback observed, không khẳng định intentionally bound; public khác local.",
      "editorial": "Câu hỏi dùng chính 127.0.0.1/200 và proxy.",
      "references": [
        "https://docs.docker.com/engine/network/port-publishing/"
      ],
      "fixtureChanges": []
    },
    "answerOverrides": {
      "expected_diagnosis": "Port publish ở 127.0.0.1:8080 và local HTTP 200; chưa biết binding loopback là chủ ý hay cấu hình sai.",
      "recommended_next_checks": "Xác nhận reverse proxy/intended exposure, socket host và đường client; không quy riêng firewall.",
      "resolution_guidance": "Owner duyệt proxy hoặc thay bind phù hợp TLS/ACL; giữ rollback.",
      "verification": "Client dùng đúng public endpoint, local/backend và ranh giới truy cập vẫn đúng thiết kế.",
      "escalate_when": "Thay bind có thể expose service chưa bảo vệ hoặc cần admin Docker host.",
      "production_warning": "Mở firewall không tự đổi loopback binding; không public backend khi chưa review."
    }
  },
  "VPS-13-004": {
    "objective": "Đối chiếu OOMKilled, giới hạn container và tải đỉnh trước khi tăng tài nguyên.",
    "customerExplanation": "Container restart lúc tải cao. Cần kiểm tra sự kiện dừng và mức dùng bộ nhớ, chưa thể mặc định memory leak.",
    "hints": [
      "Restart có thể có nhiều lý do; xem trạng thái OOM trước.",
      "Đọc OOMKilled, stats và HostConfig.Memory của đúng api.",
      "Có OOM event, limit 512MiB và snapshot gần limit; cần timeline/host headroom trước tăng hoặc bỏ limit."
    ],
    "verificationPrompt": "Ghi OOMKilled, memory usage/limit và giới hạn quan sát của snapshot. Nêu dữ liệu đỉnh tải cần thu và cách kiểm chứng sau change được duyệt.",
    "probes": {
      "P1": {
        "purpose": "Đọc cờ OOMKilled của container.",
        "why": "Xác nhận Docker đã ghi nhận sự kiện bị kill vì bộ nhớ hay chưa.",
        "meaning": "true ghi nhận OOM kill; chưa nói riêng memory leak, host shortage hoặc giới hạn nào là nguyên nhân sâu."
      },
      "P2": {
        "purpose": "Lấy snapshot tài nguyên container.",
        "why": "So mức dùng lúc đo với limit của api.",
        "meaning": "498MiB/512MiB ở 97,27% gần giới hạn; snapshot không tái hiện chính xác peak gây kill."
      },
      "G1": {
        "purpose": "Đọc memory limit theo byte trong cấu hình.",
        "why": "Xác nhận limit không chỉ dựa cột stats.",
        "meaning": "536870912 byte là 512MiB. Cần cùng cấu hình/thời điểm và host headroom trước điều chỉnh."
      }
    },
    "questions": {
      "triage": {
        "prompt": "Restart xuất hiện trong hoàn cảnh nào khách mô tả?",
        "explanation": "Tải đỉnh là bối cảnh cần so timestamp, chưa tự là nguyên nhân.",
        "options": {
          "symptom": [
            "Container restart lúc tải cao.",
            "Cần tìm sự kiện dừng và telemetry cùng thời điểm."
          ],
          "other": [
            "Container chỉ không publish port ra host.",
            "Khách nói restart, không phải chỉ đường truy cập."
          ],
          "cause": [
            "Đã xác nhận ứng dụng có memory leak.",
            "Chưa có trend hoặc phân tích phân bổ bộ nhớ."
          ]
        }
      },
      "check": {
        "prompt": "Lệnh nào đọc cờ Docker ghi nhận OOM kill?",
        "explanation": "Tách bằng chứng sự kiện với một snapshot tài nguyên.",
        "options": {
          "direct": [
            "docker inspect api --format \"{{.State.OOMKilled}}\"",
            "Đọc đúng State.OOMKilled."
          ],
          "wrong1": [
            "docker stats --no-stream",
            "Cho mức dùng hiện tại, không thay cờ sự kiện kill."
          ],
          "wrong2": [
            "docker inspect api --format \"{{.HostConfig.Memory}}\"",
            "Cho limit cấu hình, không xác nhận OOM event."
          ]
        }
      },
      "output": {
        "prompt": "OOMKilled true và stats gần 512MiB. Nhận định nào đúng?",
        "explanation": "Bộ nhớ là hướng có căn cứ, nhưng cần đo timeline và giới hạn để chọn change.",
        "options": {
          "supported": [
            "Có OOM event; cần kiểm tra limit và tải bộ nhớ.",
            "Chưa thể gán leak hoặc hứa tăng RAM là đủ."
          ],
          "over": [
            "Tăng lên 8 GiB chắc chắn hết mọi lần restart.",
            "Chưa biết host headroom, workload hoặc lỗi khác."
          ],
          "ignore": [
            "Stats sau restart thấp là có thể bỏ qua OOMKilled.",
            "Snapshot mới không bác bỏ sự kiện kill trước đó."
          ]
        }
      },
      "evidence": {
        "prompt": "Chọn hai quan sát từ inspect và stats.",
        "explanation": "Dữ liệu không tự xác định giải pháp tài nguyên.",
        "options": {
          "p1": [
            "OOMKilled là true.",
            "Docker ghi nhận sự kiện."
          ],
          "p2": [
            "Stats ghi 498MiB/512MiB.",
            "Đây là mức dùng tại lần đo."
          ],
          "over": [
            "8 GiB là limit đã được kiểm thử phù hợp.",
            "Chưa có kết quả thử hoặc capacity approval."
          ]
        }
      },
      "decision": {
        "prompt": "Trước khi thay memory limit, cần làm gì?",
        "explanation": "Thay limit cần dữ liệu tải, capacity và owner chứ không bỏ giới hạn mù.",
        "options": {
          "safe": [
            "Đo tải rồi điều chỉnh limit có duyệt.",
            "Giữ rollback và kiểm tra dưới tải tương đương."
          ],
          "unsafe": [
            "Bỏ limit rồi restart ngay trong giờ peak.",
            "Có thể đẩy OOM ra toàn host và làm gián đoạn lớn hơn."
          ],
          "close": [
            "Đóng ticket khi api vừa Up trở lại.",
            "Chưa trải qua tải đã gây restart hoặc kiểm tra app."
          ]
        }
      }
    },
    "review": {
      "technical": "OOM event khác leak hoặc sole limit-cause; stats snapshot không peak.",
      "editorial": "Câu hỏi phân biệt event, usage, configuration và action.",
      "references": [
        "https://docs.docker.com/engine/containers/resource_constraints/"
      ],
      "fixtureChanges": []
    },
    "answerOverrides": {
      "expected_diagnosis": "Docker ghi OOMKilled true; stats gần 512MiB và config limit 512MiB. Chưa định leak hoặc nguyên nhân sâu của demand.",
      "recommended_next_checks": "So timestamp OOM, peak memory, request load, app heap và host capacity.",
      "resolution_guidance": "Owner/infra tuning workload hoặc limit có approval, rollback và headroom, không bỏ limit mù.",
      "verification": "Không OOM/restart dưới tải tương đương, ứng dụng đáp ứng và host không chịu thêm áp lực bất thường.",
      "escalate_when": "Host thiếu capacity, cần phân tích ứng dụng hoặc resource change ngoài quyền support.",
      "production_warning": "Không tắt limit rồi restart trong peak hoặc hứa tăng RAM chắc chắn sửa mọi lỗi."
    }
  },
  "VPS-12-005": {
    "objective": "Đọc lock của reinstall cùng tiến độ snapshot và điều kiện an toàn dữ liệu.",
    "customerExplanation": "Khách chờ reinstall 40 phút nhưng chưa thấy thay đổi. Cần xác nhận task đang chờ hay thực sự kẹt, chưa tự hủy job khác.",
    "hints": [
      "Chờ lock khác task đã bắt đầu ghi image.",
      "So task queue với tiến độ và last_progress của snapshot.",
      "Snapshot 76%, mới tiến triển 2 phút trước; backup chưa verified và owner còn pending. Không force unlock để reinstall."
    ],
    "verificationPrompt": "Ghi lock, snapshot progress và approval/backup còn thiếu. Nêu bên xử lý nếu kẹt và cách xác nhận reinstall chỉ chạy sau đủ điều kiện.",
    "probes": {
      "P1": {
        "purpose": "Đọc trạng thái reinstall task.",
        "why": "Cần biết yêu cầu đã chạy hay đang chờ tài nguyên.",
        "meaning": "reinstall waiting lock nghĩa là chưa bắt đầu, không xác nhận reinstall bị lỗi."
      },
      "P2": {
        "purpose": "Đọc job đang giữ hàng đợi/lock.",
        "why": "Tìm thao tác có thể xung đột với việc ghi lại OS disk.",
        "meaning": "Snapshot đang chạy; cần kiểm tra tiến độ trước khi coi lock bị bỏ quên."
      },
      "G1": {
        "purpose": "Đọc tiến độ và thời điểm cập nhật snapshot.",
        "why": "Phân biệt chạy lâu với không còn tiến triển.",
        "meaning": "76% sau 40 phút, last_progress 2 phút trước: có hoạt động gần đây, chưa chứng minh job bị treo."
      },
      "G2": {
        "purpose": "Đọc điều kiện an toàn trước reinstall.",
        "why": "Reinstall có thể xóa dữ liệu nên không chỉ chờ lock hết.",
        "meaning": "backup_verified=false, owner_confirmation=pending; chưa đủ điều kiện thao tác phá dữ liệu."
      }
    },
    "questions": {
      "triage": {
        "prompt": "Khách đang hỏi về tình trạng nào của reinstall?",
        "explanation": "Thời gian chờ chưa cho biết task đã bắt đầu hay bị treo.",
        "options": {
          "symptom": [
            "Đã yêu cầu reinstall 40 phút nhưng chưa thấy đổi OS.",
            "Cần kiểm tra task và tiến độ."
          ],
          "other": [
            "OS mới đã chạy nhưng thiếu một package.",
            "Khách chưa xác nhận reinstall hoàn tất."
          ],
          "cause": [
            "Chờ 40 phút chứng minh lock bị bỏ quên.",
            "Cần owner và tiến độ job đang giữ lock."
          ]
        }
      },
      "check": {
        "prompt": "Mục nào cho biết reinstall đang chạy hay chờ?",
        "explanation": "Đọc task trước khi xem chi tiết job liên quan.",
        "options": {
          "direct": [
            "PANEL: task",
            "Ghi trạng thái waiting lock của reinstall."
          ],
          "wrong1": [
            "PANEL: snapshot progress",
            "Giúp đánh giá job đang giữ lock, không thay trạng thái reinstall."
          ],
          "wrong2": [
            "cat /etc/os-release",
            "OS chưa đổi không phân biệt task chờ với task lỗi."
          ]
        }
      },
      "output": {
        "prompt": "Reinstall chờ lock, snapshot còn tiến triển và approval chưa đủ. Nên kết luận gì?",
        "explanation": "Có job đang hoạt động và thiếu điều kiện an toàn; không tự ép tiến trình ghi OS.",
        "options": {
          "supported": [
            "Reinstall chưa chạy; cần theo dõi snapshot và hoàn tất điều kiện an toàn.",
            "Chưa có căn cứ force unlock hoặc hứa đã đổi OS."
          ],
          "over": [
            "Có thể force unlock rồi reinstall ngay.",
            "Có thể xung đột snapshot và chưa có backup/owner xác nhận."
          ],
          "ignore": [
            "Không cần xem snapshot vì reinstall có ưu tiên cao hơn.",
            "Chưa có policy cấp quyền hủy job đang hoạt động."
          ]
        }
      },
      "evidence": {
        "prompt": "Chọn hai trạng thái ban đầu của task và queue.",
        "explanation": "Chỉ xác nhận chờ lock và snapshot đang chạy.",
        "options": {
          "p1": [
            "Reinstall đang waiting lock.",
            "Chưa xác nhận task đã ghi image."
          ],
          "p2": [
            "Snapshot job đang chạy.",
            "Cần tiến độ/owner để đánh giá lock."
          ],
          "over": [
            "Support đã được phép force unlock.",
            "Không có quyền này trong bản ghi."
          ]
        }
      },
      "decision": {
        "prompt": "Khách muốn chạy reinstall ngay. Nên xử lý ra sao?",
        "explanation": "Giữ tính toàn vẹn job và điều kiện dữ liệu trước mọi thay đổi phá hủy.",
        "options": {
          "safe": [
            "Theo dõi snapshot; chuyển queue team nếu kẹt.",
            "Không bỏ qua safety gate chỉ vì khách chờ lâu."
          ],
          "unsafe": [
            "Hủy snapshot rồi ép reinstall khi backup chưa verified.",
            "Có thể mất cả nguồn khôi phục và dữ liệu production."
          ],
          "close": [
            "Đóng ticket vì reinstall task đã tồn tại.",
            "Task tồn tại chưa thực hiện yêu cầu khách."
          ]
        }
      },
      "order": {
        "prompt": "Sắp xếp xử lý reinstall đang chờ snapshot.",
        "explanation": "Tìm trạng thái thật, xử lý đúng quyền, rồi xác minh OS sau change.",
        "options": {
          "evidence": [
            "Đối chiếu lock, job owner/progress và backup/approval.",
            "Xác định còn điều kiện gì trước ghi OS."
          ],
          "verify": [
            "Xác nhận reinstall hoàn tất, đúng OS và dữ liệu theo kế hoạch.",
            "Không chỉ thấy queue hết lock là xong."
          ],
          "act": [
            "Đội có quyền xử lý queue và chạy reinstall sau owner chấp thuận.",
            "Thao tác chỉ sau safety gate đã đủ."
          ]
        }
      }
    },
    "review": {
      "technical": "40 phút không tự là hung job; progress 2 phút và safety gate phải giữ.",
      "editorial": "Lựa chọn phân biệt wait, stuck, authorized destructive action.",
      "references": [],
      "fixtureChanges": []
    },
    "answerOverrides": {
      "expected_diagnosis": "Reinstall chờ lock của snapshot đang có tiến độ; backup verification và owner confirmation chưa đủ.",
      "recommended_next_checks": "Đọc job owner, last_progress, thời gian dự kiến và safety gate trước đánh giá task kẹt.",
      "resolution_guidance": "Theo dõi snapshot; chuyển orchestration nếu thật sự kẹt. Chỉ reinstall sau backup/owner được xác nhận.",
      "verification": "Task được xử lý đúng, reinstall chỉ chạy có approval, đúng OS và dữ liệu theo kế hoạch.",
      "escalate_when": "Cần hủy job/lock hoặc can thiệp queue ngoài quyền support.",
      "production_warning": "Không force unlock/hủy snapshot để ghi OS khi dữ liệu chưa được bảo vệ."
    }
  },
  "VPS-12-006": {
    "objective": "So IP order, IP guest và IPAM trước khi lập thay đổi mạng có console và rollback.",
    "customerExplanation": "IP khách thấy trong VPS khác IP trong đơn hàng. Cần đối chiếu cấp phát và lịch sử migration trước khi sửa kết nối đang dùng.",
    "hints": [
      "IP khác order chưa chứng minh địa chỉ thuộc khách khác.",
      "So order allocation, ip -4 addr, IPAM ownership và route.",
      "Địa chỉ .40 thuộc migration pool, còn route đang qua 203.0.113.1; đổi sang .20 cần gateway và kế hoạch quản trị được duyệt."
    ],
    "verificationPrompt": "Ghi IP order, guest và gateway hiện tại cùng IPAM ownership. Nêu change có console/rollback và cách xác minh panel, route, client sau xử lý.",
    "probes": {
      "P1": {
        "purpose": "Đọc IP được order yêu cầu/cấp phát.",
        "why": "Xác định địa chỉ khách đang dùng để đối chiếu.",
        "meaning": "Order ghi 198.51.100.20; chưa chứng minh guest đang nhận IP này."
      },
      "P2": {
        "purpose": "Đọc IPv4 cấu hình trên interface guest.",
        "why": "Ghi chính xác địa chỉ và subnet đang phục vụ phiên hiện tại.",
        "meaning": "ens3 có 203.0.113.40/24, khác IP order; chưa biết lý do nếu chưa xem IPAM.",
        "output": "2: ens3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000\n    inet 203.0.113.40/24 brd 203.0.113.255 scope global ens3\n       valid_lft forever preferred_lft forever"
      },
      "G1": {
        "purpose": "Đọc chủ quản và mục đích hai IP trong IPAM.",
        "why": "Tránh gán nhầm IP từ suy đoán mismatch.",
        "meaning": ".20 thuộc order-1206, .40 thuộc migration pool; cần đối chiếu task và kế hoạch chuyển lại."
      },
      "G2": {
        "purpose": "Đọc gateway đang dùng trong guest.",
        "why": "Đổi IP có thể đòi route khác và làm rớt đường quản trị.",
        "meaning": "Default route qua 203.0.113.1 trên ens3; chưa có gateway được xác nhận cho IP .20."
      }
    },
    "questions": {
      "triage": {
        "prompt": "Khách muốn đối chiếu điều gì về địa chỉ VPS?",
        "explanation": "Cần so order với guest trước gán nguyên nhân.",
        "options": {
          "symptom": [
            "IP trong guest khác IP của order.",
            "Đúng chênh lệch khách đang hỏi."
          ],
          "other": [
            "IP không đổi nhưng DNS cache còn cũ.",
            "Khách nói về địa chỉ cấp phát, chưa có DNS evidence."
          ],
          "cause": [
            "IP guest chắc chắn bị lấy từ khách khác.",
            "Chưa đọc ownership hay lịch sử migration."
          ]
        }
      },
      "check": {
        "prompt": "Đọc đâu để xác nhận IP order-1206 phải được cấp?",
        "explanation": "Phân biệt địa chỉ trong order với cấu hình mạng đang chạy.",
        "options": {
          "direct": [
            "PANEL: order allocation",
            "Cho IP được ghi cho order."
          ],
          "wrong1": [
            "ip -4 addr",
            "Cho IP hiện tại trong guest, không phải order allocation."
          ],
          "wrong2": [
            "ip route",
            "Cho gateway/route, không xác nhận IP cam kết trong order."
          ]
        }
      },
      "output": {
        "prompt": "Order .20, guest .40 và IPAM ghi migration pool. Cách hiểu nào phù hợp?",
        "explanation": "Mismatch có lý do cần đối chiếu task; không đổi mạng từ một phiên SSH duy nhất.",
        "options": {
          "supported": [
            "Cần đối chiếu migration/cấp phát và lập change mạng có kiểm soát.",
            "Có ownership cụ thể nhưng chưa có đầy đủ cấu hình đích."
          ],
          "over": [
            ".40 chắc chắn thuộc một khách khác.",
            "IPAM ghi migration pool, không xác nhận kết luận đó."
          ],
          "ignore": [
            "Guest đang dùng được nên IP order không cần được xử lý.",
            "Dịch vụ chưa đáp ứng địa chỉ của order và nhu cầu khách."
          ]
        }
      },
      "evidence": {
        "prompt": "Chọn hai địa chỉ đã đo từ order và guest.",
        "explanation": "Chỉ chọn thông tin quan sát, không suy quyền thay đổi.",
        "options": {
          "p1": [
            "Order ghi 198.51.100.20.",
            "Đây là IP để đối chiếu cấp phát."
          ],
          "p2": [
            "Guest ens3 có 203.0.113.40/24.",
            "Đọc trực tiếp từ ip addr."
          ],
          "over": [
            "Đã có đủ thông tin để đổi IP qua SSH ngay.",
            "Chưa có gateway đích, console hoặc rollback."
          ]
        }
      },
      "decision": {
        "prompt": "Nên sửa mismatch IP bằng quy trình nào?",
        "explanation": "Network change cần bảo vệ đường quản trị và phụ thuộc dịch vụ.",
        "options": {
          "safe": [
            "Chuyển provisioning/network lập change.",
            "Đúng quyền, có gateway đích và rollback trước can thiệp."
          ],
          "unsafe": [
            "Gán .20 qua phiên SSH duy nhất để thử.",
            "Có thể mất kết nối hoặc gây trùng IP do chưa đủ cấu hình."
          ],
          "close": [
            "Đóng ticket vì guest đã có một IP hoạt động.",
            "Khách cần địa chỉ đúng order, không chỉ một IP bất kỳ."
          ]
        }
      },
      "order": {
        "prompt": "Sắp xếp xử lý địa chỉ khác order sau migration.",
        "explanation": "Xác minh quyền sở hữu và kế hoạch đích trước đổi mạng, rồi kiểm tra từ client.",
        "options": {
          "evidence": [
            "So order, IP guest, IPAM, gateway và lịch sử migration.",
            "Tránh gán IP khi thiếu thông tin cấp phát."
          ],
          "verify": [
            "So panel/guest/route và thử kết nối qua IP đúng từ client.",
            "Cần kiểm tra cả cấu hình và đường truy cập sau change."
          ],
          "act": [
            "Đội có quyền áp change được duyệt qua console, có rollback.",
            "Giữ đường quản trị và điều kiện khôi phục."
          ]
        }
      }
    },
    "review": {
      "technical": "IP mismatch chưa là cross-tenant; chuẩn hóa ip addr, giữ subnet/address gốc.",
      "editorial": "Phân biệt order/live/ownership/gateway trong từng câu.",
      "references": [
        "https://man7.org/linux/man-pages/man8/ip-address.8.html"
      ],
      "fixtureChanges": [
        {
          "probeId": "P2",
          "reason": "Chuỗi gốc gộp header và inet; sửa dạng ip addr thật, giữ 203.0.113.40/24.",
          "reference": "https://man7.org/linux/man-pages/man8/ip-address.8.html"
        }
      ]
    },
    "answerOverrides": {
      "expected_diagnosis": "IP order .20 khác guest .40; IPAM ghi .40 thuộc migration pool, không phải bằng chứng IP của khách khác.",
      "recommended_next_checks": "So task history, ownership, profile/cloud-init, gateway đích và các phiên đang dùng.",
      "resolution_guidance": "Provisioning/network lập change có console, approval và rollback; không đổi live IP từ phiên SSH duy nhất.",
      "verification": "Order/panel/guest/route khớp, client tới IP đúng và các dịch vụ phụ thuộc hoạt động.",
      "escalate_when": "Cần IPAM, edge routing hoặc cấu hình provisioning ngoài quyền guest.",
      "production_warning": "Không đoán gateway hoặc gán IP order khi chưa xác nhận ownership và đường quản trị."
    }
  },
  "VPS-12-007": {
    "objective": "Phân biệt token đọc VM với quyền reboot, kiểm tra owner và cấp quyền tối thiểu.",
    "customerExplanation": "Khách không reboot được VM qua API. Cần kiểm tra HTTP response, quyền token và ownership trước thử thao tác thay khách.",
    "hints": [
      "403 là từ chối quyền, không tự cho biết VM tắt hay API hỏng.",
      "So read:vm với permission matrix của POST reboot và owner VM/token.",
      "Cùng owner nhưng token chỉ có read:vm; cần owner tạo quyền reboot tối thiểu, không cấp admin hoặc reboot hộ."
    ],
    "verificationPrompt": "Ghi HTTP status, scope token, owner và quyền cần cho API. Không ghi token; nêu cách cấp quyền được duyệt và xác minh mà không reboot thử production.",
    "probes": {
      "P1": {
        "purpose": "Đọc phản hồi yêu cầu API reboot.",
        "why": "Phân biệt lỗi quyền với lỗi kết nối hoặc tác vụ VM.",
        "meaning": "HTTP 403 Forbidden là yêu cầu bị từ chối; riêng status chưa xác định scope, owner hoặc policy nào."
      },
      "P2": {
        "purpose": "Đọc scope token trong audit.",
        "why": "Kiểm tra token có quyền cho hành động thay đổi VM không.",
        "meaning": "Token chỉ có read:vm, không thấy quyền reboot; cần so permission matrix và resource owner."
      },
      "G1": {
        "purpose": "Đọc ánh xạ scope–API endpoint.",
        "why": "Không tự suy tên scope hoặc cấp quyền quá rộng.",
        "meaning": "GET/VM dùng read:vm, POST reboot cần reboot:vm; token hiện thiếu action scope đó."
      },
      "G2": {
        "purpose": "So owner token và VM.",
        "why": "Quyền hành động không thay kiểm tra quyền trên resource.",
        "meaning": "Cả token và VM thuộc account-1207; dữ liệu này hỗ trợ thiếu action scope hơn là owner lệch."
      }
    },
    "questions": {
      "triage": {
        "prompt": "Khách đang bị chặn ở thao tác nào?",
        "explanation": "Cần biết hành động bị từ chối trước điều tra quyền.",
        "options": {
          "symptom": [
            "Không reboot được VM của mình qua API.",
            "Đúng yêu cầu cần kiểm tra response và authorization."
          ],
          "other": [
            "Không xem được danh sách VM qua web panel.",
            "Khách nêu API reboot, không nêu mọi tác vụ đọc."
          ],
          "cause": [
            "VM chắc chắn tắt nên API không reboot được.",
            "Lời khách chưa có VM state hoặc phản hồi API."
          ]
        }
      },
      "check": {
        "prompt": "Đọc mục nào để biết API trả lỗi gì cho yêu cầu reboot?",
        "explanation": "HTTP response là điểm đầu trước đối chiếu scope và owner.",
        "options": {
          "direct": [
            "PANEL: API",
            "Cho HTTP status của request bị lỗi."
          ],
          "wrong1": [
            "PANEL: VM state",
            "Không cho phản hồi authorization của API request."
          ],
          "wrong2": [
            "PANEL: plan",
            "Thông số gói không thay quyền token."
          ]
        }
      },
      "output": {
        "prompt": "403, token read-only, cùng owner vàmatrixđòi reboot:vm. Nhận định nào đúng?",
        "explanation": "Có thiếu action scope cụ thể; không cần token admin để bỏ qua policy.",
        "options": {
          "supported": [
            "Token thiếu quyền reboot; cần owner cấp scope tối thiểu theo policy.",
            "Owner khớp nhưng read:vm không cho phép POST reboot."
          ],
          "over": [
            "Cấp admin:* là cách sửa an toàn.",
            "Quyền rộng vượt nhu cầu reboot và tăng rủi ro token."
          ],
          "ignore": [
            "403 chứng minh API engine hỏng, không cần xem scope.",
            "Matrix và audit đã chỉ ra thiếu action scope."
          ]
        }
      },
      "evidence": {
        "prompt": "Chọn hai điều response và audit ban đầu đã ghi.",
        "explanation": "Status và scope chưa tự cho quyền thực hiện reboot.",
        "options": {
          "p1": [
            "API trả HTTP 403 Forbidden.",
            "Yêu cầu đã bị từ chối."
          ],
          "p2": [
            "Token có read:vm.",
            "Đây là scope được audit ghi."
          ],
          "over": [
            "Token admin là quyền bắt buộc cho mọi lệnh reboot.",
            "Matrix cho scope hẹp reboot:vm, không yêu cầu admin."
          ]
        }
      },
      "decision": {
        "prompt": "Support nên hướng dẫn khách cấp quyền thế nào?",
        "explanation": "Authorization đúng owner và least privilege trước bất kỳ mutation nào.",
        "options": {
          "safe": [
            "Xin scope reboot tối thiểu từ owner.",
            "Không mượn quyền support hoặc giữ secret trong ticket."
          ],
          "unsafe": [
            "Mượn token admin hoặc tự reboot VM thay khách.",
            "Vượt quyền và có thể gián đoạn production ngoài ủy quyền."
          ],
          "close": [
            "Đóng ticket khi HTTP GET đã hoạt động.",
            "Đọc VM thành công chưa xác minh quyền reboot."
          ]
        }
      },
      "order": {
        "prompt": "Sắp xếp xử lý lỗi 403 của API reboot.",
        "explanation": "Đối chiếu policy/owner trước, cấp quyền phù hợp sau, kiểm tra authorization cuối.",
        "options": {
          "evidence": [
            "So HTTP status, scope, matrix và owner VM/token.",
            "Định vị thiếu quyền không cần lộ secret."
          ],
          "verify": [
            "Kiểm tra quyền endpoint theo quy trình; chỉ reboot thật khi owner duyệt thời điểm.",
            "Không dùng reboot production làm phép thử mù."
          ],
          "act": [
            "Owner phát token scope hẹp qua quy trình IAM được duyệt.",
            "Đúng người cấp quyền cần thiết, không admin mặc định."
          ]
        }
      }
    },
    "review": {
      "technical": "403 không đồng nghĩa VM off; scope hẹp và owner đều cần; không reboot tự ý để verify.",
      "editorial": "Phân biệt tác vụ đọc/mutation, token metadata/secret.",
      "references": [],
      "fixtureChanges": []
    },
    "answerOverrides": {
      "expected_diagnosis": "API 403; token chỉ có read:vm, trong khi reboot cần reboot:vm. Token và VM cùng owner.",
      "recommended_next_checks": "Xác minh identity, resource owner, matrix của endpoint và policy; không thu token secret trong ticket.",
      "resolution_guidance": "Owner cấp token quyền tối thiểu qua quy trình IAM hoặc chuyển đội authorization.",
      "verification": "Kiểm tra quyền theo quy trình; chỉ thử mutation thực khi owner đã duyệt tác động và thời điểm.",
      "escalate_when": "Quyền hoặc ownership tranh chấp, matrix không rõ hoặc cần IAM quyết định.",
      "production_warning": "Không cấp admin:* mặc định hoặc tự reboot production để kiểm tra token."
    }
  },
  "VPS-12-008": {
    "objective": "Đối chiếu retry order với VM IDs, activity và billing trước xử lý cấp phát trùng.",
    "customerExplanation": "Sau retry mua hàng, khách thấy VPS xuất hiện hai lần. Cần xác định hai VM hay chỉ nhãn trùng và bảo vệ dữ liệu trên cả hai.",
    "hints": [
      "Hai nhãn không tự chứng minh hai VM, nhưng cũng không cho phép xóa một bản.",
      "So task order-771 với VM IDs, activity và invoice.",
      "Có hai VM ID, task completed hai lần và billing một VPS; VM không ghi login chưa chắc rỗng. Cần reconciliation có owner."
    ],
    "verificationPrompt": "Ghi order, hai VM ID, activity và billing mapping. Nêu owner xác nhận VM giữ lại, dữ liệu cần bảo vệ và điều kiện xử lý bản trùng.",
    "probes": {
      "P1": {
        "purpose": "Đọc các lần chạy provisioning của order.",
        "why": "Khách retry nên cần xem task có được xử lý hai lần không.",
        "meaning": "Order-771 completed twice; chưa định vị nguyên nhân retry hoặc idempotency."
      },
      "P2": {
        "purpose": "Đọc VM IDs thuộc order.",
        "why": "Phân biệt nhãn UI trùng với hai resource khác nhau.",
        "meaning": "Có vm-771a và vm-771b, không phải chỉ một ID xuất hiện hai dòng."
      },
      "G1": {
        "purpose": "So thời gian tạo và activity hai VM.",
        "why": "Cần xác nhận dữ liệu khách trước quyết định giữ/xóa.",
        "meaning": "VM a có login, VM b chưa ghi login; không có login record không chứng minh disk b rỗng."
      },
      "G2": {
        "purpose": "Đọc invoice/resource mapping của order.",
        "why": "Tránh giải quyết duplicate bằng thu thêm tiền hoặc cấp thêm VM.",
        "meaning": "Invoice 1 VPS nhưng allocated 2 VM; billing/provisioning cần đối soát."
      }
    },
    "questions": {
      "triage": {
        "prompt": "Khách thấy điều gì sau retry mua hàng?",
        "explanation": "Phân biệt hiện tượng nhân đôi với nguyên nhân hoặc an toàn xóa.",
        "options": {
          "symptom": [
            "VPS xuất hiện hai lần sau retry purchase.",
            "Cần đối chiếu order và resource ID."
          ],
          "other": [
            "Chỉ invoice có hai dòng nhưng panel một VM.",
            "Đây là tình huống billing khác chưa được khách nêu."
          ],
          "cause": [
            "Bản thứ hai chắc chắn rỗng và xóa được.",
            "Chưa kiểm tra VM activity, disk và owner."
          ]
        }
      },
      "check": {
        "prompt": "Mục nào cho biết order-771 đã được provision bao nhiêu lần?",
        "explanation": "Task history khác danh sách VM hiện có.",
        "options": {
          "direct": [
            "PANEL: tasks",
            "Ghi các lần completed của order."
          ],
          "wrong1": [
            "PANEL: VM list",
            "Liệt kê resource nhưng không giải thích số lần task đã chạy."
          ],
          "wrong2": [
            "PANEL: billing order-771",
            "Mapping billing không thay execution history."
          ]
        }
      },
      "output": {
        "prompt": "Hai lần complete, hai VM ID và invoice một VPS. Nên kết luận tới mức nào?",
        "explanation": "Bằng chứng hỗ trợ cấp phát trùng, cần đối soát và bảo vệ dữ liệu chứ chưa xóa VM.",
        "options": {
          "supported": [
            "Có hai resource cho cùng order; cần provisioning/billing reconciliation.",
            "Cần điều tra process retry/idempotency và xác nhận VM cần giữ."
          ],
          "over": [
            "VM thứ hai chắc chắn không có dữ liệu.",
            "Thiếu log login không chứng minh emptiness hoặc quyền xóa."
          ],
          "ignore": [
            "Chỉ đổi tên hiển thị một VM là xong.",
            "Có hai VM ID và hai resource thực, không chỉ nhãn UI."
          ]
        }
      },
      "evidence": {
        "prompt": "Chọn hai quan sát trong task history và VM list.",
        "explanation": "Những quan sát này chưa cho phép xóa một VM.",
        "options": {
          "p1": [
            "Order-771 được ghi completed hai lần.",
            "Task history có hai completion."
          ],
          "p2": [
            "Có hai ID vm-771a và vm-771b.",
            "Đây là hai resource ID khác nhau."
          ],
          "over": [
            "vm-771b chắc chắn rỗng vì không ghi login.",
            "Có thể có dữ liệu qua automation hoặc log thiếu."
          ]
        }
      },
      "decision": {
        "prompt": "Nên xử lý hai VM của một order thế nào?",
        "explanation": "Owner quyết định VM giữ lại và dữ liệu, đội provisioning/billing đối soát.",
        "options": {
          "safe": [
            "Giữ cả hai VM chờ đối soát.",
            "Tránh xóa nhầm VM khách đang dùng."
          ],
          "unsafe": [
            "Xóa VM tạo sau vì nghĩ là bản rỗng.",
            "Thời gian tạo không chứng minh dữ liệu hoặc quyền xóa."
          ],
          "close": [
            "Đóng ticket vì invoice chỉ tính một VM.",
            "Tài nguyên, quản lý và dữ liệu vẫn đang trùng."
          ]
        }
      },
      "order": {
        "prompt": "Sắp xếp đối soát VPS xuất hiện hai lần.",
        "explanation": "Định danh và bảo vệ trước, cleanup có quyền sau, rồi so mapping cuối.",
        "options": {
          "evidence": [
            "So order/task, VM IDs, disk/activity và invoice.",
            "Không dựa vào tên hiển thị để chọn bản xóa."
          ],
          "verify": [
            "Xác nhận một dịch vụ đúng, dữ liệu được giữ và billing mapping khớp.",
            "Cleanup resource chưa đủ nếu billing hoặc data chưa xác minh."
          ],
          "act": [
            "Đội liên quan đối soát và cleanup chỉ sau owner duyệt phương án.",
            "Đúng quyền và giữ bản sao dữ liệu cần thiết."
          ]
        }
      }
    },
    "review": {
      "technical": "Không login record chưa là rỗng; retry completed twice hỗ trợ duplicate không chứng minh nguyên nhân code.",
      "editorial": "Các phương án quanh identity/data/billing khác nhau.",
      "references": [],
      "fixtureChanges": []
    },
    "answerOverrides": {
      "expected_diagnosis": "Order-771 completed hai lần và có hai VM ID; billing ghi một VPS. Chưa xác nhận VM nào có dữ liệu cần giữ.",
      "recommended_next_checks": "So task/order/payment, VM IDs, disk/activity và owner; không coi thiếu login record là disk rỗng.",
      "resolution_guidance": "Giữ trạng thái cả hai, chuyển provisioning/billing reconciliation; cleanup chỉ sau phương án owner duyệt.",
      "verification": "Một dịch vụ đúng, dữ liệu được giữ, resource và billing mapping khớp.",
      "escalate_when": "Có duplicate resource, dữ liệu hoặc billing cần nhiều đội phối hợp.",
      "production_warning": "Không xóa VM tạo sau hoặc thu thêm tiền để hợp thức hóa cấp phát trùng."
    }
  },
  "VPS-12-001": {
    "objective": "Tách thanh toán với cấp phát VPS khi IPAM không còn IPv4.",
    "customerExplanation": "Khách đã thanh toán nhưng VPS còn ở bước cấp phát. Cần kiểm tra task trước khi xử lý bên trong guest.",
    "hints": [
      "Thanh toán xong chưa chứng minh VM và IP sẵn sàng.",
      "So trạng thái provisioning task với lỗi IPAM của đúng pool.",
      "Pool sg-02 có 0 IPv4 trống và 14 yêu cầu chờ. Cần đội cấp phát/capacity, không tự lấy IP ngoài pool."
    ],
    "verificationPrompt": "Ghi task, pool và tình trạng IPv4. Nêu đội tiếp nhận, điều có thể báo khách và cách xác minh VPS/IP/đăng nhập sau cấp phát.",
    "probes": {
      "P1": {
        "purpose": "Đọc trạng thái tác vụ cấp phát VPS.",
        "why": "Cần biết task hoàn tất hay đã lỗi trước khi hướng dẫn kiểm tra guest.",
        "meaning": "Task failed; chưa có bằng chứng VPS đã sẵn sàng."
      },
      "P2": {
        "purpose": "Đọc lỗi cấp phát IPv4 từ IPAM.",
        "why": "Task cần địa chỉ từ đúng pool của vùng.",
        "meaning": "No free IPv4 in pool sg-02 chỉ tới thiếu địa chỉ ở pool này, không phải cấu hình guest."
      },
      "G1": {
        "purpose": "Đọc capacity và hàng đợi của pool.",
        "why": "Đối chiếu lỗi với số địa chỉ có thể cấp.",
        "meaning": "Available IPv4=0 và 14 yêu cầu chờ; chưa có địa chỉ được xác nhận cho order này."
      }
    },
    "questions": {
      "triage": {
        "prompt": "Điều gì chưa hoàn tất dù khách đã thanh toán?",
        "explanation": "Thanh toán và cấp phát là hai bước khác nhau.",
        "options": {
          "symptom": [
            "VPS vẫn ở bước cấp phát sau thanh toán.",
            "Cần mở task của đúng order."
          ],
          "other": [
            "VPS đã có IP nhưng SSH từ chối mật khẩu.",
            "Chưa có xác nhận VPS ready hoặc lỗi xác thực."
          ],
          "cause": [
            "Thanh toán xong nghĩa là IPv4 chắc chắn đã được gán.",
            "Billing không xác minh kết quả IPAM và provisioning."
          ]
        }
      },
      "check": {
        "prompt": "Mở đâu để biết quá trình tạo VPS đã tới trạng thái nào?",
        "explanation": "Task giúp chọn hướng cấp phát thay vì xử lý guest quá sớm.",
        "options": {
          "direct": [
            "PANEL: provisioning task",
            "Đọc đúng tác vụ của order."
          ],
          "wrong1": [
            "PANEL: plan",
            "Thông số gói không cho kết quả task."
          ],
          "wrong2": [
            "PANEL: VM state",
            "VM state không thay thế task, nhất là khi VM chưa tạo xong."
          ]
        }
      },
      "output": {
        "prompt": "Task failed và IPAM không còn IPv4 trong sg-02. Nên kiểm tra lớp nào?",
        "explanation": "Dữ liệu đang chỉ tới cấp phát địa chỉ, chưa phải VPS ready để sửa guest.",
        "options": {
          "supported": [
            "Pool IPv4 cạn; cần đội IPAM/provisioning xử lý.",
            "Không tự gán địa chỉ ngoài inventory."
          ],
          "over": [
            "Thanh toán đã bảo đảm IP xuất hiện trong guest.",
            "Task và IPAM chưa hoàn tất."
          ],
          "ignore": [
            "Chỉ cần khách sửa network profile trong guest.",
            "Lỗi đang ở capacity pool, chưa có VM/IP ready."
          ]
        }
      },
      "evidence": {
        "prompt": "Chọn hai trạng thái task và IPAM đã ghi.",
        "explanation": "Đọc kết quả thực trước đề xuất retry hoặc sửa cấu hình.",
        "options": {
          "p1": [
            "Provisioning task là failed.",
            "Không phải completed/ready."
          ],
          "p2": [
            "IPAM không còn IPv4 trong pool sg-02.",
            "Lỗi xác định pool không cấp được địa chỉ."
          ],
          "over": [
            "Invoice thanh toán chứng minh IP đã cấp.",
            "Trạng thái IPAM không hỗ trợ kết luận này."
          ]
        }
      },
      "decision": {
        "prompt": "Nên xử lý yêu cầu chờ cấp phát này thế nào?",
        "explanation": "Đội quản lý pool và task cần tiếp nhận, không tạo tài nguyên ngẫu nhiên.",
        "options": {
          "safe": [
            "Chuyển IPAM xử lý cấp phát.",
            "Đúng lớp lỗi; không hứa ETA chưa có."
          ],
          "unsafe": [
            "Tự gán IP ngoài pool hoặc tạo VM khác để thử.",
            "Có thể trùng IP hoặc tạo tài nguyên tính phí thêm."
          ],
          "close": [
            "Đóng ticket vì đã xác nhận khách trả tiền.",
            "Khách cần VPS sử dụng được, không chỉ xác nhận payment."
          ]
        }
      }
    },
    "review": {
      "technical": "Billing success khác provisioning success; pool 0 không là guest profile issue.",
      "editorial": "Giải thích cấp phát cho L0, không đưa khách tới SSH trước VM ready.",
      "references": [],
      "fixtureChanges": []
    },
    "answerOverrides": {
      "expected_diagnosis": "Provisioning failed vì pool sg-02 không còn IPv4; thanh toán không đồng nghĩa VPS đã ready.",
      "recommended_next_checks": "So order/task ID, pool capacity và yêu cầu đang chờ; kiểm tra retry đã xử lý trước đó chưa.",
      "resolution_guidance": "Chuyển IPAM/provisioning capacity; báo phương án và ETA chỉ khi được xác nhận.",
      "verification": "Cấp phát hoàn tất một lần, IP đúng và khách truy cập được VPS.",
      "escalate_when": "Pool cạn hoặc task cần đội cấp phát/provider xử lý.",
      "production_warning": "Không lấy IP ngoài pool hoặc tạo VM ngẫu nhiên bên ngoài order."
    }
  },
  "VPS-12-002": {
    "objective": "Đối chiếu trạng thái panel cũ với host và kết nối khách, giữ VM đang chạy khi điều tra đồng bộ.",
    "customerExplanation": "Panel ghi Stopped nhưng khách vẫn SSH được. Cần so thời điểm đồng bộ với host trước khi bấm start hoặc reboot.",
    "hints": [
      "Một nhãn trạng thái có thời điểm đồng bộ, không phải lúc nào cũng là hiện tại.",
      "So last sync với virsh domstate của đúng VM.",
      "Panel cũ 50 phút, host running và queue tồn đọng. Chuyển control-plane rồi xác minh panel và kết nối khách."
    ],
    "verificationPrompt": "Ghi trạng thái panel/host kèm thời gian và kết nối khách. Nêu cách xử lý đồng bộ có quyền, kiểm tra sau đó mà không reboot VM đang phục vụ.",
    "probes": {
      "P1": {
        "purpose": "Đọc VM state và tuổi dữ liệu panel.",
        "why": "Panel mâu thuẫn SSH nên cần kiểm tra dữ liệu có cũ không.",
        "meaning": "Stopped được đồng bộ 50 phút trước; chưa chắc phản ánh VM hiện tại."
      },
      "P2": {
        "purpose": "Đọc trạng thái VM tại hypervisor.",
        "why": "Cần nguồn khác panel để đối chiếu đúng vm-110.",
        "meaning": "running xác nhận host đang chạy VM; chưa chứng minh mọi dịch vụ guest khỏe."
      },
      "G1": {
        "purpose": "Đọc tình trạng worker đồng bộ.",
        "why": "Tìm lý do panel cập nhật chậm so với host.",
        "meaning": "Last success 08:00, current 08:50 và backlog 124 phù hợp dữ liệu cũ; cần xử lý sync rồi đo lại."
      }
    },
    "questions": {
      "triage": {
        "prompt": "Hai thông tin nào khách thấy mâu thuẫn?",
        "explanation": "So nguồn và timestamp trước khi coi VM đã tắt.",
        "options": {
          "symptom": [
            "Panel ghi Stopped nhưng SSH còn dùng được.",
            "Đúng mâu thuẫn cần đối chiếu."
          ],
          "other": [
            "SSH và host đều báo VM tắt.",
            "Khách vẫn SSH được, không phải cả hai cùng tắt."
          ],
          "cause": [
            "SSH kết nối được nghĩa là panel đã tự sửa.",
            "SSH không kiểm tra worker cập nhật panel."
          ]
        }
      },
      "check": {
        "prompt": "Đọc đâu để biết nhãn Stopped được đồng bộ khi nào?",
        "explanation": "Tuổi thông tin cần thiết khi so với host hiện tại.",
        "options": {
          "direct": [
            "PANEL: VM state",
            "Bản ghi có last sync cùng nhãn Stopped."
          ],
          "wrong1": [
            "virsh domstate vm-110",
            "Đọc host, không cho thời điểm panel đồng bộ."
          ],
          "wrong2": [
            "systemctl status sshd",
            "Đọc service SSH, không đọc timestamp panel."
          ]
        }
      },
      "output": {
        "prompt": "Panel Stopped cũ 50 phút, host running. Nhận định nào phù hợp?",
        "explanation": "Điều tra lớp đồng bộ mà không cắt VM đang chạy.",
        "options": {
          "supported": [
            "Panel có thể đang cũ; cần kiểm tra worker đồng bộ.",
            "Host và lời khách mâu thuẫn trạng thái được đọc từ trước."
          ],
          "over": [
            "SSH thành công một lần nghĩa là sync đã khỏe.",
            "SSH không kiểm tra worker hoặc backlog."
          ],
          "ignore": [
            "Phải tin Stopped và bấm start ngay.",
            "Host báo running; power action có thể tác động sai VM đang phục vụ."
          ]
        }
      },
      "evidence": {
        "prompt": "Chọn hai trạng thái đọc được từ panel và hypervisor.",
        "explanation": "Không biến running thành xác nhận toàn bộ ứng dụng.",
        "options": {
          "p1": [
            "Panel ghi Stopped với last sync 50 phút trước.",
            "Đây là thông tin có timestamp cũ."
          ],
          "p2": [
            "virsh domstate trả running.",
            "Đây là quan sát host của VM được hỏi."
          ],
          "over": [
            "Panel hết backlog vì SSH còn hoạt động.",
            "SSH không đo trạng thái worker."
          ]
        }
      },
      "decision": {
        "prompt": "Nên làm gì khi VM đang chạy còn panel bị cũ?",
        "explanation": "Giữ dịch vụ hoạt động và chuyển lỗi đồng bộ đúng đội.",
        "options": {
          "safe": [
            "Giữ VM; chuyển lỗi đồng bộ panel.",
            "Không dùng reboot để sửa nhãn quản lý cũ."
          ],
          "unsafe": [
            "Start hoặc reboot vì panel ghi Stopped.",
            "Có thể gián đoạn VM mà không sửa worker."
          ],
          "close": [
            "Đóng ticket vì SSH đang được.",
            "Panel chưa đúng; cần xác minh sync phục hồi."
          ]
        }
      }
    },
    "review": {
      "technical": "Panel timestamp khác host current; running không chứng minh guest services; giữ hypervisor context.",
      "editorial": "Câu hỏi tập trung mâu thuẫn 50 phút thay power action.",
      "references": [
        "https://www.libvirt.org/manpages/virsh.html#domstate"
      ],
      "fixtureChanges": []
    },
    "answerOverrides": {
      "expected_diagnosis": "Panel Stopped từ 50 phút trước không khớp host running; worker backlog hỗ trợ lỗi đồng bộ trạng thái.",
      "recommended_next_checks": "Đối chiếu timestamp, sync task/error và kiểm tra guest từ client; không suy mọi ứng dụng khỏe từ running.",
      "resolution_guidance": "Giữ VM đang phục vụ, chuyển control-plane xử lý worker/reconcile theo quy trình.",
      "verification": "Panel phản ánh host đúng và kết nối/dịch vụ khách vẫn hoạt động.",
      "escalate_when": "Worker lỗi hoặc quyền backend ngoài phạm vi support.",
      "production_warning": "Không start/reboot một VM đang running chỉ vì nhãn panel cũ."
    }
  },
  "VPS-12-003": {
    "objective": "Đối chiếu OS đặt mua với guest, bảo vệ dữ liệu trước đề xuất cấp lại máy.",
    "customerExplanation": "Khách đặt AlmaLinux nhưng VPS boot Ubuntu. Cần xác nhận order, image đã áp và dữ liệu khách đã tạo.",
    "hints": [
      "Tên OS trên order không thay thế thông tin bên trong VM.",
      "So ordered OS với /etc/os-release và image audit.",
      "Image Ubuntu khác order AlmaLinux. Reinstall có thể ghi đè disk, cần backup, owner và kế hoạch trước."
    ],
    "verificationPrompt": "Ghi OS đặt mua, OS guest và image audit. Nêu dữ liệu cần bảo vệ, phương án owner đồng ý và cách kiểm tra OS/dịch vụ sau xử lý.",
    "probes": {
      "P1": {
        "purpose": "Đọc OS khách đặt trong order.",
        "why": "Xác nhận mong muốn trước khi so với guest.",
        "meaning": "Order ghi AlmaLinux 9; chưa chứng minh image đó đã được triển khai."
      },
      "P2": {
        "purpose": "Đọc nhận diện OS do guest cung cấp.",
        "why": "Kiểm tra VM thực sự chạy OS gì thay vì chỉ tin nhãn order.",
        "meaning": "ID=ubuntu và VERSION_ID=24.04 xác nhận guest Ubuntu 24.04, khác OS đặt.",
        "output": "ID=ubuntu\nVERSION_ID=\"24.04\""
      },
      "G1": {
        "purpose": "Đọc template order và image được áp.",
        "why": "Tìm lỗi mapping cấp phát và task cần chuyển.",
        "meaning": "Order AlmaLinux 9 nhưng image Ubuntu 24.04 ở task pr-1203; chưa cấp quyền reinstall."
      }
    },
    "questions": {
      "triage": {
        "prompt": "Khách cần đối chiếu thông tin OS nào?",
        "explanation": "Sai OS cần xác nhận, không tự suy khách chưa có dữ liệu.",
        "options": {
          "symptom": [
            "Đặt AlmaLinux nhưng guest boot Ubuntu.",
            "Đúng chênh lệch khách báo."
          ],
          "other": [
            "Đặt Ubuntu và guest cũng Ubuntu.",
            "Không có khác biệt như khách mô tả."
          ],
          "cause": [
            "Có thể reinstall ngay vì chưa có dữ liệu.",
            "Lời khách không xác nhận dữ liệu hoặc quyền rebuild."
          ]
        }
      },
      "check": {
        "prompt": "Mục nào xác nhận OS trong đơn hàng?",
        "explanation": "OS mong muốn thuộc order, guest cho OS thực tế.",
        "options": {
          "direct": [
            "PANEL: ordered OS",
            "Đọc OS khách đặt."
          ],
          "wrong1": [
            "cat /etc/os-release",
            "Đọc OS thực tế, không đọc order."
          ],
          "wrong2": [
            "PANEL: VM state",
            "Running/stopped không cho OS đặt mua."
          ]
        }
      },
      "output": {
        "prompt": "Order AlmaLinux 9 còn os-release là Ubuntu 24.04. Kết luận nào đúng?",
        "explanation": "Đã có mismatch; cách khắc phục còn phụ thuộc dữ liệu và owner.",
        "options": {
          "supported": [
            "Order và OS guest không khớp; cần audit và bảo vệ dữ liệu.",
            "Sai OS không tự cho quyền reinstall."
          ],
          "over": [
            "Reinstall không mất dữ liệu vì đang dùng sai OS.",
            "Reinstall có thể ghi đè disk bất kể OS."
          ],
          "ignore": [
            "OS guest không quan trọng vì panel ghi AlmaLinux.",
            "os-release phản ánh image đang chạy và cần được đối chiếu."
          ]
        }
      },
      "evidence": {
        "prompt": "Chọn hai định danh OS đã đọc.",
        "explanation": "Ghi mong muốn và thực tế, không thêm quyền hành động.",
        "options": {
          "p1": [
            "Order yêu cầu AlmaLinux 9.",
            "Đọc từ ordered OS."
          ],
          "p2": [
            "Guest ID ubuntu, version 24.04.",
            "Đọc từ os-release."
          ],
          "over": [
            "Khách đã duyệt xóa disk để reinstall.",
            "Chưa có approval hoặc kiểm tra dữ liệu."
          ]
        }
      },
      "decision": {
        "prompt": "Nên xử lý VPS được cấp sai OS thế nào?",
        "explanation": "Khôi phục đúng order đồng thời bảo vệ dữ liệu phát sinh.",
        "options": {
          "safe": [
            "Lập kế hoạch đổi OS, giữ dữ liệu.",
            "Owner đồng ý trước thao tác disk."
          ],
          "unsafe": [
            "Xóa VM hoặc reinstall ngay cho đúng template.",
            "Có thể mất dữ liệu hoặc dịch vụ chưa được chấp thuận."
          ],
          "close": [
            "Đóng ticket vì Ubuntu vẫn boot được.",
            "Boot được không đáp ứng OS đã đặt."
          ]
        }
      }
    },
    "review": {
      "technical": "os-release cần assignment mỗi dòng; sai OS không cho quyền reinstall.",
      "editorial": "Tách order–guest–audit và dữ liệu khách trong câu hỏi.",
      "references": [
        "https://www.freedesktop.org/software/systemd/man/latest/os-release.html"
      ],
      "fixtureChanges": [
        {
          "probeId": "P2",
          "reason": "Sửa ID và VERSION_ID từ cùng dòng thành new line assignment s, giữ Ubuntu 24.04.",
          "reference": "https://www.freedesktop.org/software/systemd/man/latest/os-release.html"
        }
      ]
    },
    "answerOverrides": {
      "expected_diagnosis": "Order AlmaLinux 9 nhưng guest Ubuntu 24.04; audit xác nhận image áp khác template đặt.",
      "recommended_next_checks": "So đúng order/VM/task, dữ liệu khách đã tạo và khả năng backup hoặc migration.",
      "resolution_guidance": "Provisioning cùng owner lập phương án migration/rebuild có backup, approval và kế hoạch dịch vụ.",
      "verification": "OS đúng order, dữ liệu theo kế hoạch và dịch vụ được kiểm tra từ client.",
      "escalate_when": "Cần sửa template/provisioning hoặc thay đổi disk production.",
      "production_warning": "Không tự reinstall hoặc xóa VM chỉ vì OS sai."
    }
  },
  "VPS-11-001": {
    "objective": "Đọc trạng thái backup và lỗi quota của đích lưu, rồi xác định cách chạy lại mà không xóa nhầm bản còn cần giữ.",
    "customerExplanation": "Khách cho biết lần sao lưu ban đêm chưa hoàn tất. Cần kiểm tra tác vụ và log, chưa thể nói đã có bản sao lưu dùng được.",
    "hints": [
      "Khách hỏi về lần sao lưu mới nhất, không phải việc VPS có đang chạy hay không.",
      "Đối chiếu trạng thái tác vụ với BACKUP LOG để biết lỗi nằm ở nguồn hay đích.",
      "Thông báo quota của đích cần được kiểm tra cùng dung lượng và chính sách giữ bản; chưa có căn cứ xóa bản cũ."
    ],
    "verificationPrompt": "Ghi lần backup thất bại, lỗi tại đích lưu và bên cần xử lý quota. Nêu cách kiểm tra lần chạy lại và thử khôi phục mà không ghi đè dữ liệu thật.",
    "probes": {
      "P1": {
        "purpose": "Đọc trạng thái tác vụ sao lưu.",
        "why": "Cần biết lần backup khách đang hỏi đã hoàn tất hay bị lỗi.",
        "meaning": "failed nghĩa là tác vụ thất bại; riêng trạng thái này chưa nêu lý do hoặc xác nhận bản backup dùng được."
      },
      "P2": {
        "purpose": "Đọc lỗi do tác vụ sao lưu ghi lại.",
        "why": "Log giúp phân biệt lỗi đích lưu với lỗi đọc dữ liệu trong VPS.",
        "meaning": "target quota exceeded chỉ ra giới hạn dung lượng của đích backup. Chưa có bằng chứng lần backup này đã hoàn tất."
      },
      "G1": {
        "purpose": "Đọc dung lượng và quota của kho backup.",
        "why": "Cần đối chiếu lỗi vượt quota với số liệu của đúng kho lưu.",
        "meaning": "Kho backup-pool-2 đã dùng 500/500 GiB. Số liệu không cho biết bản cũ nào được phép xóa."
      }
    },
    "questions": {
      "triage": {
        "prompt": "Khách cần xác minh điều gì về lần backup ban đêm?",
        "explanation": "Yêu cầu là kiểm tra một lần backup chưa hoàn tất; chưa có thông tin VPS bị tắt hoặc mất dữ liệu.",
        "options": {
          "symptom": [
            "Lần backup ban đêm chưa hoàn tất.",
            "Đúng với điều khách báo; cần mở tác vụ tương ứng để kiểm tra."
          ],
          "other": [
            "VPS không khởi động sau khi sửa fstab.",
            "Khách không báo lỗi khởi động; đây là sự cố khác với lần backup chưa hoàn tất."
          ],
          "cause": [
            "Đã có thể xác nhận kho backup đầy từ lời khách.",
            "Khách chỉ mô tả kết quả. Muốn xác nhận quota phải đọc log và dung lượng kho."
          ]
        }
      },
      "check": {
        "prompt": "Mở mục nào để biết lần backup vừa rồi đã thành công hay thất bại?",
        "explanation": "Trạng thái tác vụ thuộc hệ thống backup, không phải trạng thái service SSH hoặc dung lượng filesystem của guest.",
        "options": {
          "direct": [
            "PANEL: backup task",
            "Đây là bản ghi trạng thái của chính tác vụ backup khách đang hỏi."
          ],
          "wrong1": [
            "df -h /",
            "Lệnh đo dung lượng filesystem chứa / trong guest; không cho biết trạng thái tác vụ ở kho backup."
          ],
          "wrong2": [
            "PANEL: restore points",
            "Danh sách điểm khôi phục cho biết các bản đã có, không thay thế trạng thái lần backup vừa thất bại."
          ]
        }
      },
      "output": {
        "prompt": "Tác vụ failed và log báo target quota exceeded. Lỗi đang chỉ tới đâu?",
        "explanation": "Log xác định quota ở đích backup; dọn dữ liệu trong guest không tự tăng quota của kho lưu.",
        "options": {
          "supported": [
            "Tác vụ bị lỗi quota ở đích lưu; cần kiểm tra kho backup.",
            "Thông báo gọi rõ target; cần xem dung lượng, retention và bản backup hiện có."
          ],
          "over": [
            "Có bản ghi tác vụ trong panel nghĩa là backup đã an toàn.",
            "Panel vẫn lưu tác vụ thất bại; sự tồn tại của bản ghi không bảo đảm có bản backup hoàn chỉnh."
          ],
          "ignore": [
            "Chưa thể phân biệt lỗi nguồn và đích dù log đã ghi target quota.",
            "Log đã cung cấp vị trí cần kiểm tra là đích backup; chưa biết cách khắc phục không có nghĩa là không định vị được lớp lỗi."
          ]
        }
      },
      "evidence": {
        "prompt": "Chọn hai điều được trạng thái tác vụ và log xác nhận.",
        "explanation": "Hai quan sát là tác vụ thất bại và quota đích bị vượt; chưa có kiểm tra restore.",
        "options": {
          "p1": [
            "Tác vụ backup có trạng thái failed.",
            "Trạng thái được ghi trực tiếp trong bản tác vụ."
          ],
          "p2": [
            "Log ghi lỗi quota của đích backup.",
            "target quota exceeded nói tới hạn mức ở kho lưu."
          ],
          "over": [
            "Backup mới đã được xác minh là khôi phục được.",
            "Không có kết quả xác minh hoặc thử khôi phục; failed không chứng minh bản mới dùng được."
          ]
        }
      },
      "decision": {
        "prompt": "Nên xử lý lỗi quota này thế nào để giữ khả năng khôi phục?",
        "explanation": "Việc tăng quota hoặc dọn backup phải do đúng bên thực hiện theo retention; sau đó cần kiểm tra lần chạy lại và khả năng restore.",
        "options": {
          "safe": [
            "Kiểm tra retention; chuyển đội backup xử lý quota.",
            "Giữ các bản còn phải lưu và giao việc thay đổi kho cho đúng bên có quyền."
          ],
          "unsafe": [
            "Xóa bản backup cũ để trống kho mà chưa kiểm tra retention.",
            "Có thể xóa bản khôi phục cuối cùng hoặc bản bắt buộc phải giữ; cần chính sách và phê duyệt trước."
          ],
          "close": [
            "Đóng ticket ngay khi gửi yêu cầu tăng quota.",
            "Yêu cầu được gửi chưa có nghĩa quota đã đổi hoặc lần backup mới đã chạy thành công."
          ]
        }
      }
    },
    "review": {
      "technical": "Tách quota target khỏi dung lượng guest; không xem failed task hoặc catalog entry là backup đã kiểm chứng. Giữ nguyên output panel được biên soạn.",
      "editorial": "Viết lại đủ năm câu, 15 phương án/feedback, ba hint và toàn bộ giải thích phép kiểm tra; diễn giải backup bằng tiếng Việt.",
      "references": [],
      "fixtureChanges": []
    },
    "answerOverrides": {
      "expected_diagnosis": "Lần backup thất bại vì đích lưu báo vượt quota. Kho backup-pool-2 đã dùng 500/500 GiB; không có bằng chứng bản backup mới đã hoàn tất.",
      "recommended_next_checks": "Đối chiếu đúng task và kho lưu, retention, các bản còn phải giữ và tác vụ đang chạy. Kiểm tra có bản backup gần nhất nào đã thử khôi phục được.",
      "resolution_guidance": "Chuyển đội backup/capacity xử lý quota hoặc dọn bản hết retention theo phê duyệt. Không xóa dữ liệu guest hay bản khôi phục cuối cùng để thử.",
      "verification": "Tác vụ chạy lại thành công, kiểm tra tính toàn vẹn và thử restore trong vùng riêng. Xác nhận phạm vi dữ liệu và mốc thời gian khôi phục.",
      "escalate_when": "Cần đổi quota, dọn kho dùng chung, hoặc không còn bản đã xác minh đáp ứng yêu cầu dữ liệu của khách.",
      "production_warning": "Dọn kho backup cần retention và quyền của chủ kho. Không ghi đè production để thử bản backup mới."
    }
  },
  "VPS-12-004": {
    "objective": "Đối chiếu số vCPU của gói dịch vụ, cấu hình VM và số CPU tiến trình guest sử dụng được trước khi đề xuất thay đổi.",
    "customerExplanation": "Khách thấy gói dịch vụ ghi 4 vCPU nhưng lệnh trong VPS trả 2. Cần đối chiếu các lớp; chưa thể chọn reboot chỉ từ chênh lệch này.",
    "hints": [
      "Số CPU của gói dịch vụ và số CPU guest đang sử dụng không phải cùng một phép đo.",
      "So PANEL: plan với nproc; sau đó xem current_vcpus, max_vcpus và tác vụ cập nhật.",
      "nproc đếm CPU sẵn dùng cho tiến trình, có thể chịu giới hạn affinity. current_vcpus=2 và update_task=pending cần đội ảo hóa kiểm tra."
    ],
    "verificationPrompt": "Ghi ba số liệu: vCPU của gói, nproc và current/max ở host. Nêu điều chưa biết về CPU offline/affinity, bên được phép cập nhật và cách xác minh guest sau change.",
    "probes": {
      "P1": {
        "purpose": "Đọc số vCPU của gói dịch vụ.",
        "why": "Đây là số CPU khách đang dùng để đối chiếu với guest.",
        "meaning": "Plan ghi 4 vCPU. Đây là cấu hình mong muốn, chưa chứng minh VM đang được cấp đủ 4 CPU."
      },
      "P2": {
        "purpose": "Đếm CPU sẵn dùng cho tiến trình đang chạy nproc.",
        "why": "Cần ghi lại điều guest thực sự quan sát, rồi so với cấu hình và giới hạn tiến trình.",
        "meaning": "nproc trả 2. Kết quả không tự phân biệt VM chỉ được cấp 2 CPU với CPU offline hoặc giới hạn affinity."
      },
      "G1": {
        "purpose": "Đọc số vCPU hiện tại và giới hạn của VM trên host.",
        "why": "Cần biết gói 4 CPU đã được áp vào cấu hình đang chạy hay chưa.",
        "meaning": "current_vcpus=2, max_vcpus=4 và tác vụ còn pending. Giới hạn tối đa 4 không đồng nghĩa VM đang chạy với 4 CPU."
      }
    },
    "questions": {
      "triage": {
        "prompt": "Hai số liệu nào khách cho biết đang không khớp?",
        "explanation": "Khách đang so số vCPU trên panel với kết quả bên trong VM; chưa nêu nguyên nhân chênh lệch.",
        "options": {
          "symptom": [
            "Panel ghi 4 vCPU, guest chỉ báo 2.",
            "Đúng với yêu cầu cần đối chiếu của khách."
          ],
          "other": [
            "Container có giới hạn bộ nhớ 512 MiB.",
            "Khách không nêu container hoặc giới hạn RAM."
          ],
          "cause": [
            "Có thể xác nhận ngay guest cần reboot để nhận CPU.",
            "Chưa xem cấu hình host, CPU offline hoặc affinity; reboot chưa phải kết luận từ lời khách."
          ]
        }
      },
      "check": {
        "prompt": "Muốn xác nhận gói dịch vụ cam kết bao nhiêu vCPU, nên đọc mục nào?",
        "explanation": "Gói dịch vụ là thông tin cấp phát ở panel; phải tách khỏi việc CPU nào đang online hoặc được tiến trình sử dụng.",
        "options": {
          "direct": [
            "PANEL: plan",
            "Mục này xác nhận số vCPU của gói mà khách đã mua."
          ],
          "wrong1": [
            "nproc",
            "Lệnh đo CPU tiến trình guest sử dụng được, không đọc số vCPU cam kết trong gói."
          ],
          "wrong2": [
            "lscpu",
            "Lệnh xem thông tin CPU trong guest; cần panel để xác nhận thông số gói đã mua."
          ]
        }
      },
      "output": {
        "prompt": "Plan ghi 4 còn nproc trả 2. Hai kết quả này cho phép kết luận tới đâu?",
        "explanation": "Đã xác nhận có chênh lệch giữa cấu hình gói và CPU sẵn dùng; cần xem lớp host và guest để giải thích.",
        "options": {
          "supported": [
            "Gói là 4 vCPU, tiến trình guest đang dùng được 2; cần đối chiếu host và giới hạn guest.",
            "nproc không nói trực tiếp nguyên nhân; host config và CPU/affinity trong guest giúp phân biệt."
          ],
          "over": [
            "Reboot guest chắc chắn làm nproc tăng lên 4.",
            "Nếu host chỉ cấp current=2 hoặc affinity vẫn giới hạn thì reboot không bảo đảm thay đổi kết quả."
          ],
          "ignore": [
            "Không thể xác nhận có chênh lệch vì hai phép đo khác lớp.",
            "Hai phép đo vẫn xác nhận điều khách thấy; khác lớp là lý do cần đối chiếu thêm, không phải bỏ qua."
          ]
        }
      },
      "evidence": {
        "prompt": "Chọn hai quan sát về vCPU được dữ liệu hỗ trợ.",
        "explanation": "Chỉ chọn số của gói và kết quả nproc; chưa suy ra hành động phục hồi.",
        "options": {
          "p1": [
            "Plan trong panel ghi 4 vCPU.",
            "Đây là thông số được đọc từ gói dịch vụ."
          ],
          "p2": [
            "nproc trong guest trả về 2.",
            "Đây là CPU sẵn dùng cho tiến trình nproc tại lúc đo; chưa khẳng định toàn bộ CPU vật lý hay tối đa của VM."
          ],
          "over": [
            "Guest đã nhận 4 vCPU và reboot sẽ tự bật hết.",
            "Chưa có CPU online list hay bằng chứng host đã cấp current=4."
          ]
        }
      },
      "decision": {
        "prompt": "Sau khi thấy host current=2, max=4 và task pending, hướng tiếp theo là gì?",
        "explanation": "Phân biệt current với maximum trước khi lập change; cần đội ảo hóa xác nhận hotplug hoặc downtime, không tự reboot production.",
        "options": {
          "safe": [
            "Chuyển ảo hóa xác minh cấu hình vCPU.",
            "Đội có quyền host đánh giá khả năng áp cấu hình; phía guest vẫn cần kiểm tra CPU offline và affinity."
          ],
          "unsafe": [
            "Reboot VPS khách hàng để thử nhận thêm CPU.",
            "Có gián đoạn mà chưa bảo đảm host cấp CPU mới; thiếu phê duyệt và kế hoạch."
          ],
          "close": [
            "Đóng ticket vì plan đã ghi đúng 4 vCPU.",
            "Plan đúng chưa giải quyết việc guest chỉ dùng được 2 CPU."
          ]
        }
      }
    },
    "review": {
      "technical": "Sửa cách diễn giải nproc: CPU sẵn dùng cho tiến trình, không đồng nhất tuyệt đối với CPU online của cả VM. Tách current/max vCPU và task pending; giữ nguyên đáp án và output.",
      "editorial": "Thay prompt chung bằng phép đối chiếu plan–guest–host; feedback mỗi lựa chọn nói đúng lớp dữ liệu.",
      "references": [
        "https://www.gnu.org/software/coreutils/manual/html_node/nproc-invocation.html",
        "https://libvirt.org/formatdomain.html"
      ],
      "fixtureChanges": []
    },
    "answerOverrides": {
      "expected_diagnosis": "Plan ghi 4 vCPU nhưng nproc trả 2. Host ghi current_vcpus=2, max_vcpus=4 và tác vụ cập nhật còn pending; cấu hình mong muốn chưa đồng nghĩa CPU đang được guest dùng.",
      "recommended_next_checks": "Đội ảo hóa đối chiếu cấu hình live/persistent, tác vụ cập nhật và hỗ trợ hotplug. Trong guest kiểm tra CPU online và affinity của tiến trình đo.",
      "resolution_guidance": "Phối hợp đội ảo hóa áp thay đổi tài nguyên được duyệt. Nếu cần downtime, xác nhận lịch và phương án khôi phục với owner; không tự reboot VPS.",
      "verification": "So lại plan, vCPU đang chạy ở host, CPU online và nproc trong điều kiện không bị giới hạn affinity; xác minh dịch vụ khách vẫn hoạt động.",
      "escalate_when": "Task cập nhật chưa áp, host current/max không khớp, hoặc cần thay đổi có downtime/hotplug ngoài quyền support.",
      "production_warning": "Reboot không bảo đảm tăng CPU và làm gián đoạn ứng dụng. Chỉ thực hiện change khi đúng người có quyền phê duyệt."
    }
  },
  "VPS-13-006": {
    "objective": "Phân biệt route trong container với chuyển tiếp IPv4 và NAT ở Docker host, rồi chọn cách sửa có kiểm soát.",
    "customerExplanation": "Container liên lạc được với host nhưng chưa ra được Internet. Điều này cần kiểm tra đường ra ngoài container, không chỉ cổng ứng dụng.",
    "hints": [
      "Tới được host không chứng minh gói được host chuyển tiếp ra Internet.",
      "Đọc route trong container và net.ipv4.ip_forward trên host; đối chiếu gateway của bridge.",
      "Forwarding bằng 0 không phù hợp policy egress được phép. Vẫn phải kiểm tra NAT/firewall; chỉ đổi forwarding chưa xác minh được kết nối."
    ],
    "verificationPrompt": "Ghi route của container, giá trị forwarding và policy egress. Nêu bên có quyền đổi host, kế hoạch rollback và phép thử IP/DNS từ container sau xử lý.",
    "probes": {
      "P1": {
        "purpose": "Đọc bảng route IPv4 bên trong container api.",
        "why": "Container tới host được nhưng cần kiểm tra có đường mặc định tới ngoài subnet hay không.",
        "meaning": "default via 172.17.0.1 dev eth0 là đường mặc định qua bridge host. Nó không chứng minh host cho chuyển tiếp hoặc có NAT."
      },
      "P2": {
        "purpose": "Đọc cờ chuyển tiếp IPv4 của Docker host.",
        "why": "Muốn ra Internet qua bridge, gói container phải được host chuyển tiếp theo policy.",
        "meaning": "net.ipv4.ip_forward = 0 cho biết forwarding IPv4 đang tắt; đây là một rào cản, chưa đánh giá NAT hoặc toàn bộ firewall."
      },
      "G1": {
        "purpose": "Đọc subnet và gateway của Docker bridge.",
        "why": "Cần xác nhận next hop trong container có khớp mạng do Docker quản lý không.",
        "meaning": "Bridge dùng 172.17.0.0/16, gateway 172.17.0.1; route container trỏ đúng gateway được ghi trong cấu hình."
      },
      "G2": {
        "purpose": "Đọc chính sách egress và yêu cầu phê duyệt của host.",
        "why": "Không tự bật forwarding nếu chưa biết host có được phép cho container ra ngoài hay không.",
        "meaning": "Policy cho phép egress qua bridge nhưng yêu cầu phê duyệt thay đổi. Chưa có xác nhận quyền thực hiện change."
      }
    },
    "questions": {
      "triage": {
        "prompt": "Kết nối nào còn hoạt động, và kết nối nào đang lỗi?",
        "explanation": "Ticket mô tả phạm vi host so với Internet; chưa đủ để quy lỗi cho DNS hay application.",
        "options": {
          "symptom": [
            "Container tới host được, nhưng không tới Internet.",
            "Đây là phạm vi cần kiểm tra ở đường đi qua host."
          ],
          "other": [
            "Ứng dụng chỉ bị từ chối mật khẩu database.",
            "Lỗi xác thực database không được khách nêu và không mô tả đường mạng ra Internet."
          ],
          "cause": [
            "Từ lời khách đã xác nhận thiếu NAT trên host.",
            "Chưa đọc route, forwarding hoặc NAT; nhiều lớp có thể gây cùng triệu chứng."
          ]
        }
      },
      "check": {
        "prompt": "Lệnh nào xem container api đang chọn gateway nào để ra ngoài?",
        "explanation": "Cần đọc bảng route trong đúng network namespace của container, trước khi đánh giá host forwarding.",
        "options": {
          "direct": [
            "docker exec api ip route",
            "docker exec chạy phép đọc route trong container api, nơi gói bắt đầu đi."
          ],
          "wrong1": [
            "ip route",
            "Nếu chạy trên host, lệnh chỉ đọc route của host; cần docker exec để xem route trong container api."
          ],
          "wrong2": [
            "docker network ls",
            "Lệnh liệt kê các Docker network, không hiện bảng route mà container api thực sự đang dùng."
          ]
        }
      },
      "output": {
        "prompt": "Route qua 172.17.0.1 đã có nhưng host ip_forward=0. Kết luận nào phù hợp?",
        "explanation": "Forwarding bị tắt có thể ngăn egress bridge; vẫn cần kiểm tra NAT/firewall và yêu cầu policy trước thay đổi.",
        "options": {
          "supported": [
            "Container có default route; host đang tắt forwarding, còn NAT/policy cần đối chiếu.",
            "Hai lớp khác nhau: route hướng gói tới host, forwarding quyết định host có chuyển gói đi tiếp."
          ],
          "over": [
            "Chỉ bật ip_forward là mọi lỗi NAT và firewall sẽ hết.",
            "Bật forwarding không tự chứng minh rule NAT và filter đã đúng."
          ],
          "ignore": [
            "Vì container có default route nên host forwarding không còn liên quan.",
            "Default route mới đưa gói tới host; host vẫn phải được phép chuyển tiếp sang mạng ngoài."
          ]
        }
      },
      "evidence": {
        "prompt": "Chọn hai điều đã được kiểm tra trực tiếp trong container và host.",
        "explanation": "Đối chiếu địa chỉ next hop với trạng thái forwarding; chưa coi container đã có Internet.",
        "options": {
          "p1": [
            "Container có default route qua 172.17.0.1.",
            "Bảng route ghi rõ next hop và eth0."
          ],
          "p2": [
            "Host đang đặt net.ipv4.ip_forward bằng 0.",
            "sysctl là phép đọc trên host; giá trị này cho biết forwarding đang tắt."
          ],
          "over": [
            "NAT và firewall chắc chắn đúng ngay sau khi bật forwarding.",
            "Chưa có rule dump hoặc phép thử egress sau change; không thể xác nhận trước."
          ]
        }
      },
      "decision": {
        "prompt": "Policy cho phép egress nhưng cần phê duyệt. Nên chuyển hướng xử lý thế nào?",
        "explanation": "Thay đổi ở host có thể ảnh hưởng mọi container; cần admin đúng quyền kiểm tra Docker networking và rollback.",
        "options": {
          "safe": [
            "Nhờ admin host kiểm tra bridge/NAT/firewall và lập change được duyệt.",
            "Đúng phạm vi host, bao gồm quyền, ảnh hưởng và kế hoạch khôi phục cấu hình nếu change không đạt."
          ],
          "unsafe": [
            "Bật forwarding và mở toàn bộ firewall để thử kết nối.",
            "Thay đổi rộng có thể làm lộ dịch vụ, chưa tuân thủ policy hay giới hạn tác động."
          ],
          "close": [
            "Đóng ticket vì route trong container đã có.",
            "Route tồn tại chưa đáp ứng yêu cầu container ra Internet."
          ]
        }
      },
      "order": {
        "prompt": "Sắp xếp các bước khôi phục egress qua Docker host.",
        "explanation": "Xác định route/forwarding và policy trước; change ở host cần phê duyệt, rồi xác minh từ chính container.",
        "options": {
          "evidence": [
            "Đối chiếu route, bridge gateway, forwarding và policy egress.",
            "Cần phân biệt cấu hình container với quyền chuyển tiếp ở host trước change."
          ],
          "verify": [
            "Thử IP và DNS từ container; kiểm tra lại NAT/firewall theo policy.",
            "Thử thực tế sau change để xác nhận đường đi, không chỉ đọc sysctl."
          ],
          "act": [
            "Admin host áp change NAT/forwarding được duyệt, có rollback.",
            "Sau khi khoanh lớp lỗi, đúng người có quyền mới thay cấu hình host."
          ]
        }
      }
    },
    "review": {
      "technical": "Tách route container, IPv4 forwarding, NAT và firewall; không cam kết bật ip_forward chữa mọi lớp. Kiểm tra Docker bridge docs và iptables/nftables forwarding caveat.",
      "editorial": "Viết lại đủ sáu câu theo đường đi gói và ranh giới quyền; hint tăng dần theo container→host→policy.",
      "references": [
        "https://docs.docker.com/engine/network/packet-filtering-firewalls/",
        "https://docs.docker.com/engine/network/drivers/bridge/"
      ],
      "fixtureChanges": []
    },
    "answerOverrides": {
      "expected_diagnosis": "Container có route qua bridge 172.17.0.1 nhưng Docker host đang tắt chuyển tiếp IPv4. Điều này không phù hợp policy cho phép egress; chưa xác minh toàn bộ NAT và firewall.",
      "recommended_next_checks": "Kiểm tra bridge, next hop, host route, forwarding và rule NAT/filter của Docker theo backend đang dùng. Đối chiếu policy egress và phạm vi tác động đến container khác.",
      "resolution_guidance": "Admin host lập change forwarding/NAT/firewall theo policy, có phê duyệt và rollback. Support không tự bật forwarding hoặc mở firewall rộng trên host khách.",
      "verification": "Từ chính container thử IP, DNS và dịch vụ TCP được phép; kiểm tra firewall/NAT vẫn hạn chế đúng phạm vi và container khác không bị ảnh hưởng.",
      "escalate_when": "Cần thay đổi Docker host dùng chung, rule của provider, hoặc routing/NAT ngoài phạm vi quyền support.",
      "production_warning": "Bật ip_forward không tự sửa NAT/filter; sửa host networking có thể ảnh hưởng mọi container."
    }
  },
  "VPS-14-008": {
    "objective": "Đọc lý do đình chỉ dịch vụ, theo dõi hồ sơ abuse và chuyển đúng người có quyền quyết định mở lại.",
    "customerExplanation": "Khách yêu cầu VPS đang bị đình chỉ hoạt động lại ngay. Trước hết cần xác định lý do đình chỉ và trạng thái xử lý; chưa thể hứa thời điểm mở lại.",
    "hints": [
      "Đình chỉ dịch vụ có thể liên quan billing hoặc security; lời khách chưa xác định lý do.",
      "So lý do ở BILLING: service với hồ sơ PANEL: security và dòng thời gian appeal.",
      "Hồ sơ còn mở và policy giao quyền override cho security-lead. Yêu cầu gấp không thay thế quyết định có audit."
    ],
    "verificationPrompt": "Ghi mã hồ sơ, lý do đình chỉ, trạng thái appeal và bên đang xử lý. Nêu điều kiện được mở lại, ai có quyền quyết định và cách kiểm tra dịch vụ sau quyết định.",
    "probes": {
      "P1": {
        "purpose": "Đọc lý do dịch vụ bị đình chỉ.",
        "why": "Cần phân biệt nợ phí với đình chỉ liên quan abuse trước khi trả lời khách.",
        "meaning": "Suspended gắn hồ sơ AB-2026-14. Bản ghi này không nói hóa đơn chưa thanh toán hoặc cho phép support tự mở dịch vụ."
      },
      "P2": {
        "purpose": "Đọc trạng thái điều tra security.",
        "why": "Lý do đình chỉ gắn abuse nên phải xem đội security đã có quyết định chưa.",
        "meaning": "Investigation open nghĩa là hồ sơ còn đang được điều tra. Chưa có bằng chứng cho phép mở lại."
      },
      "G1": {
        "purpose": "Đọc thời điểm, trạng thái appeal và người nhận xử lý.",
        "why": "Cần cung cấp trạng thái có thể kiểm chứng và chuyển hồ sơ tới đúng người đang phụ trách.",
        "meaning": "Appeal đã nhận, reviewer là security-oncall; received không phải approved và chưa có ETA hoàn tất."
      },
      "G2": {
        "purpose": "Đọc điều kiện kết thúc hold và quyền override.",
        "why": "Cần biết ai được quyết định, thay vì xử lý theo mức độ gấp của yêu cầu.",
        "meaning": "Hold còn hiệu lực đến khi review xong; quyền override thuộc security-lead. Support không được tự bỏ hold."
      }
    },
    "questions": {
      "triage": {
        "prompt": "Trước khi mở hồ sơ, điều gì thực sự đã biết từ lời khách?",
        "explanation": "Khách báo VPS bị đình chỉ và muốn mở lại; nguyên nhân chỉ được xác nhận sau khi đọc hồ sơ dịch vụ.",
        "options": {
          "symptom": [
            "VPS đang bị đình chỉ; khách yêu cầu hoạt động lại ngay.",
            "Đúng với yêu cầu khách gửi, chưa gán nguyên nhân abuse hay nợ phí."
          ],
          "other": [
            "Hóa đơn quá hạn là lý do duy nhất của việc đình chỉ.",
            "Chưa đọc billing; không thể gán mọi đình chỉ cho nợ phí."
          ],
          "cause": [
            "Có đủ dữ kiện để cho phép mở lại ngay.",
            "Yêu cầu gấp chưa xác nhận lý do hold hoặc quyền được bỏ hold."
          ]
        }
      },
      "check": {
        "prompt": "Để biết dịch vụ bị đình chỉ vì lý do gì, nên đọc đâu trước?",
        "explanation": "Lý do hold là dữ liệu quản lý dịch vụ; kiểm tra guest không thay thế hồ sơ này.",
        "options": {
          "direct": [
            "BILLING: service",
            "Hồ sơ dịch vụ ghi trạng thái và mã nguyên nhân đình chỉ để đi tiếp đúng quy trình."
          ],
          "wrong1": [
            "PANEL: VM state",
            "Trạng thái chạy/dừng không nêu hồ sơ hoặc lý do đình chỉ dịch vụ."
          ],
          "wrong2": [
            "PANEL: invoices",
            "Hóa đơn giúp kiểm tra nợ phí nhưng không bao quát các lý do đình chỉ như security hold."
          ]
        }
      },
      "output": {
        "prompt": "Hồ sơ abuse còn open và policy giới hạn quyền override. Support có thể kết luận gì?",
        "explanation": "Phải phân biệt appeal đã nhận với quyết định cho mở lại; support chuyển hồ sơ và thông báo trạng thái, không tự vượt quyền.",
        "options": {
          "supported": [
            "Hold còn hiệu lực; cần quyết định của security trước khi mở lại.",
            "Investigation chưa kết thúc và policy chưa cho phép support tự bỏ hold."
          ],
          "over": [
            "Khách yêu cầu gấp nên support được bỏ qua abuse hold.",
            "Mức độ gấp không thay đổi người có quyền hoặc điều kiện policy."
          ],
          "ignore": [
            "Không cần đọc mã hồ sơ vì mọi đình chỉ xử lý như nợ phí.",
            "AB-2026-14 chỉ tới quy trình security; thanh toán không tự kết thúc điều tra abuse."
          ]
        }
      },
      "evidence": {
        "prompt": "Chọn hai trạng thái được hồ sơ dịch vụ và security ghi nhận.",
        "explanation": "Trạng thái hiện tại là đình chỉ gắn abuse và điều tra còn mở; chưa có approval khôi phục.",
        "options": {
          "p1": [
            "Dịch vụ Suspended, gắn hồ sơ AB-2026-14.",
            "Mã hồ sơ xuất hiện ngay trong lý do đình chỉ."
          ],
          "p2": [
            "Investigation đang open.",
            "Hồ sơ security chưa ghi quyết định kết thúc."
          ],
          "over": [
            "Yêu cầu khẩn của khách đã thay thế approval của security.",
            "Không có dữ liệu nào cấp quyền này; policy còn giữ hold."
          ]
        }
      },
      "decision": {
        "prompt": "Khách cần câu trả lời gấp nhưng security chưa kết luận. Nên làm gì?",
        "explanation": "Cần xác minh người yêu cầu, chuyển evidence/appeal đúng quy trình và chỉ thông báo ETA đã được xác nhận.",
        "options": {
          "safe": [
            "Chuyển security xử lý appeal; báo đúng trạng thái.",
            "Tiếp tục xử lý đúng người có quyền và tránh hứa thời điểm chưa được cung cấp."
          ],
          "unsafe": [
            "Mở lại hoặc đổi IP để khách tạm dùng khi điều tra còn mở.",
            "Né hold có thể làm tiếp diễn abuse và vượt quyền; không phải biện pháp hỗ trợ được phép."
          ],
          "close": [
            "Đóng ticket ngay vì đã chuyển security.",
            "Chuyển hồ sơ chưa phải kết thúc yêu cầu; cần theo dõi tiếp nhận và quyết định."
          ]
        }
      },
      "order": {
        "prompt": "Sắp xếp việc xử lý appeal khi VPS bị abuse hold.",
        "explanation": "Đọc hồ sơ và policy trước, chuyển appeal đúng bên, rồi xác minh trạng thái thực theo quyết định được duyệt.",
        "options": {
          "evidence": [
            "Đối chiếu mã abuse, trạng thái review, owner và quyền theo policy.",
            "Đây là căn cứ xác định đúng hồ sơ và người được quyết định."
          ],
          "verify": [
            "Đối chiếu quyết định với panel; nếu cho mở lại thì kiểm tra kết nối và dịch vụ.",
            "Approval và trạng thái được áp là hai bước; chỉ xác minh kết nối sau khi được phép mở."
          ],
          "act": [
            "Chuyển appeal/bằng chứng cho security và theo dõi quyết định có audit.",
            "Đội có quyền đánh giá hồ sơ; support không tự thay thế quyết định này."
          ]
        }
      }
    },
    "review": {
      "technical": "Lý do abuse khác nonpayment; received khác approved; giữ ranh giới security-lead và không cam kết ETA hoặc resolved từ escalation. Các panel field là dữ liệu tình huống, không phải chính sách nhà cung cấp thật.",
      "editorial": "Bỏ lộ lý do abuse khỏi đáp án triage trước điều tra; dùng tiếng Việt cho đình chỉ, hồ sơ, chuyển cấp.",
      "references": [],
      "fixtureChanges": []
    },
    "answerOverrides": {
      "expected_diagnosis": "Dịch vụ bị đình chỉ theo hồ sơ abuse AB-2026-14; điều tra còn mở và appeal mới ở trạng thái received. Chưa có quyết định cho phép mở lại.",
      "recommended_next_checks": "Xác minh owner qua kênh quy định, mã hồ sơ, người nhận xử lý và bằng chứng appeal. Đọc policy về thời điểm kết thúc hold và quyền security-lead.",
      "resolution_guidance": "Chuyển appeal và bằng chứng cho Abuse/Security, theo dõi tiếp nhận và thông báo trạng thái/ETA đã được xác nhận. Không tự bỏ hold, đổi IP để né hoặc xóa log.",
      "verification": "Có quyết định được ghi audit; panel phản ánh đúng quyết định. Chỉ khi được phép khôi phục mới kiểm tra kết nối và dịch vụ từ phía khách.",
      "escalate_when": "Bắt buộc chuyển Abuse/Security để quyết định giữ hoặc mở hold; support không có quyền thay thế đánh giá này.",
      "production_warning": "Yêu cầu gấp không cho phép vượt abuse hold. Bảo toàn log và chỉ chia sẻ chứng cứ theo quyền truy cập hồ sơ."
    }
  },
  "VPS-11-005": {
    "objective": "Đối chiếu disk đã restore với inventory data volume trước khi reattach hoặc restore riêng.",
    "customerExplanation": "OS đã boot sau restore nhưng khách không thấy data disk. Cần xem job có bao gồm disk dữ liệu không.",
    "hints": [
      "OS boot không chứng minh data disk riêng đã được khôi phục.",
      "So Included disks với lsblk và volume inventory.",
      "Job chỉ có vda; vol-72 còn available nhưng chưa attach, snapshot riêng chưa thử restore. Không tạo filesystem lên disk phỏng đoán."
    ],
    "verificationPrompt": "Ghi scope disk của job, disk guest thấy và volume/snapshot tìm được. Nêu quyền reattach/restore, bảo vệ hiện trạng và cách kiểm tra dữ liệu.",
    "probes": {
      "P1": {
        "purpose": "Đọc disk được job restore xử lý.",
        "why": "Cần biết data disk có nằm trong cùng job với OS không.",
        "meaning": "Included disks: vda only chỉ gồm vda, không tự bao gồm vdb."
      },
      "P2": {
        "purpose": "Liệt kê block device guest thấy.",
        "why": "So trạng thái guest sau restore với disk ứng dụng cần.",
        "meaning": "Chỉ có vda và phân vùng hệ thống, không có vdb. Chưa thể nói volume dữ liệu đã bị xóa.",
        "output": "NAME   MAJ:MIN RM SIZE RO TYPE MOUNTPOINTS\nvda    252:0    0  30G  0 disk\n└─vda1 252:1    0  30G  0 part /"
      },
      "G1": {
        "purpose": "Tìm snapshot riêng cho data disk.",
        "why": "Job OS không chứa vdb nên cần nguồn dữ liệu riêng.",
        "meaning": "vol-72 có snapshot ngày 20/10 nhưng chưa thử restore; catalog không bảo đảm dữ liệu dùng được."
      },
      "G2": {
        "purpose": "Đọc attachment VM–volume hiện tại.",
        "why": "Phân biệt không attach với volume đã mất.",
        "meaning": "VM chỉ attach vda; vol-72 còn available và chưa attach. Cần đúng ID, quyền và kiểm tra integrity."
      }
    },
    "questions": {
      "triage": {
        "prompt": "Sau restore, phần nào đã hoạt động và phần nào còn thiếu?",
        "explanation": "Boot chỉ kiểm chứng một phần, không thay kiểm tra data disk.",
        "options": {
          "symptom": [
            "OS boot được nhưng data disk chưa xuất hiện.",
            "Đúng phần khách cần tìm lại."
          ],
          "other": [
            "VM không khởi động được OS.",
            "Khách đã xác nhận boot được."
          ],
          "cause": [
            "Volume dữ liệu chắc chắn bị xóa khỏi storage.",
            "Guest không thấy disk chưa chứng minh host đã xóa volume."
          ]
        }
      },
      "check": {
        "prompt": "Đọc đâu để biết job restore đã bao gồm data disk chưa?",
        "explanation": "Scope của job không thể suy từ việc guest boot được.",
        "options": {
          "direct": [
            "PANEL: restore job",
            "Included disks ghi phạm vi của job."
          ],
          "wrong1": [
            "lsblk",
            "Đọc disk hiện có, không mô tả phạm vi job đã chạy."
          ],
          "wrong2": [
            "PANEL: current volume attachment",
            "Attachment hiện tại khác manifest backup/restore."
          ]
        }
      },
      "output": {
        "prompt": "Job chỉ có vda, guest thiếu vdb, vol-72 còn available. Cách hiểu nào đúng?",
        "explanation": "Tách scope job, visibility guest và inventory host trước mọi thao tác.",
        "options": {
          "supported": [
            "Restore OS chưa gồm data disk; cần đánh giá volume hoặc snapshot riêng.",
            "Phải xác nhận đúng ID và integrity trước dùng nguồn riêng."
          ],
          "over": [
            "Restore vda đã khôi phục toàn bộ dữ liệu vdb.",
            "Manifest không ghi vdb."
          ],
          "ignore": [
            "Không thấy vdb nghĩa là không còn nguồn dữ liệu nào.",
            "Inventory còn volume và snapshot riêng cần đánh giá."
          ]
        }
      },
      "evidence": {
        "prompt": "Chọn hai quan sát từ job và lsblk.",
        "explanation": "Hai nguồn chưa xác nhận dữ liệu bị xóa.",
        "options": {
          "p1": [
            "Job chỉ liệt kê vda.",
            "Đây là scope được ghi rõ."
          ],
          "p2": [
            "Guest không liệt kê vdb.",
            "Đây là trạng thái tại lúc đo."
          ],
          "over": [
            "Toàn bộ /data chắc chắn nằm trong restore OS.",
            "Chưa có manifest data disk hoặc kiểm tra nội dung."
          ]
        }
      },
      "decision": {
        "prompt": "Trước khi gắn hoặc restore vol-72, cần làm gì?",
        "explanation": "Đúng volume, đúng quyền và bảo vệ hiện trạng đều cần trước change dữ liệu.",
        "options": {
          "safe": [
            "Giữ hiện trạng, chuyển storage xác minh volume.",
            "Tránh gắn nhầm hoặc ghi đè disk đang có."
          ],
          "unsafe": [
            "Tạo filesystem mới trên vdb để có lại data disk.",
            "Format không phục hồi dữ liệu và có thể phá volume vừa attach."
          ],
          "close": [
            "Đóng ticket vì OS đã boot.",
            "Data disk và ứng dụng vẫn chưa được xác minh."
          ]
        }
      },
      "order": {
        "prompt": "Sắp xếp việc khôi phục data disk sau restore OS.",
        "explanation": "Xác định nguồn trước, change có quyền sau, rồi kiểm tra nội dung.",
        "options": {
          "evidence": [
            "So job disks, lsblk, volume ID và snapshot riêng.",
            "Biết đúng nguồn trước reattach/restore."
          ],
          "verify": [
            "Kiểm tra disk/mount và dữ liệu ứng dụng ở mốc đã thống nhất.",
            "Tên vdb xuất hiện chưa chứng minh dữ liệu đầy đủ."
          ],
          "act": [
            "Storage reattach hoặc restore đúng disk theo kế hoạch owner duyệt.",
            "Chỉ thao tác sau kiểm định nguồn và bảo vệ hiện trạng."
          ]
        }
      }
    },
    "review": {
      "technical": "Thay lsblk pseudo-stdout bằng bảng; available/catalog chưa là kiểm tra toàn vẹn đạt.",
      "editorial": "Dùng scope vda/vdb và vol-72 cụ thể.",
      "references": [
        "https://man7.org/linux/man-pages/man8/lsblk.8.html"
      ],
      "fixtureChanges": [
        {
          "probeId": "P2",
          "reason": "Thay mô tả vda 30G, no vdb bằng bảng device, giữ bằng chứng vda-only.",
          "reference": "https://man7.org/linux/man-pages/man8/lsblk.8.html"
        }
      ]
    },
    "answerOverrides": {
      "expected_diagnosis": "Job restore chỉ gồm vda; guest chưa thấy vdb. vol-72 còn available, có snapshot riêng chưa thử restore.",
      "recommended_next_checks": "Đối chiếu volume ID, scope backup, attachment, owner và integrity của nguồn dữ liệu.",
      "resolution_guidance": "Bảo vệ hiện trạng; storage reattach hoặc restore đúng disk sau kế hoạch được owner duyệt.",
      "verification": "Kiểm tra disk/mount, checksum hoặc dữ liệu ứng dụng và mốc khôi phục.",
      "escalate_when": "Cần storage/backup operator xử lý volume hoặc đánh giá tính toàn vẹn.",
      "production_warning": "Không format disk đoán hoặc restore lại OS để tìm data disk."
    }
  },
  "VPS-11-006": {
    "objective": "Tính khoảng trống thời gian backup–incident, phân biệt với số đơn thiếu và khả năng phục hồi bằng log.",
    "customerExplanation": "Sau restore, khách thiếu các đơn hôm qua. Cần đối chiếu mốc backup và dữ liệu giao dịch trước khi kết luận mất bao nhiêu.",
    "hints": [
      "Ngày backup không trực tiếp đếm đơn bị thiếu.",
      "So 20/10 00:00 UTC với 22/10 12:00 UTC và tìm binlog.",
      "Khoảng cách 60 giờ; binlog có tới 09:30 ngày 22 nhưng integrity pending, chưa bảo đảm replay được."
    ],
    "verificationPrompt": "Ghi khoảng cách backup–incident, mốc binlog và order IDs cần đối chiếu. Nêu cách thử phục hồi riêng và mốc dữ liệu cần owner đồng ý.",
    "probes": {
      "P1": {
        "purpose": "Đọc mốc tạo backup đã restore.",
        "why": "Cần biết dữ liệu hiện tại cũ tới đâu.",
        "meaning": "Backup tạo 20/10 00:00 UTC; bản này không tự có thay đổi sau đó."
      },
      "P2": {
        "purpose": "Đọc thời điểm incident.",
        "why": "Tính khoảng thời gian giữa nguồn backup và đích phục hồi.",
        "meaning": "22/10 12:00 UTC sau backup 60 giờ; không đồng nghĩa mọi đơn trong 60 giờ bị mất."
      },
      "G1": {
        "purpose": "Tìm log giao dịch DB còn lưu.",
        "why": "Có thể phục hồi dữ liệu sau backup nếu log liên tục và dùng được.",
        "meaning": "Binlog có đến 22/10 09:30 UTC nhưng integrity pending; chưa chứng minh replay thành công."
      },
      "G2": {
        "purpose": "Đọc kiểm tra sau restore.",
        "why": "Boot không thay thế kiểm tra đơn hàng.",
        "meaning": "Backup boot được; order integrity pending, chưa biết đơn thiếu hoặc trùng."
      }
    },
    "questions": {
      "triage": {
        "prompt": "Khách cần kiểm tra điều gì sau restore?",
        "explanation": "Nội dung giao dịch khác trạng thái boot hoặc service.",
        "options": {
          "symptom": [
            "Đơn hôm qua không xuất hiện sau restore.",
            "Cần đối chiếu thời gian và order IDs."
          ],
          "other": [
            "OS không boot sau restore.",
            "Khách không báo lỗi khởi động."
          ],
          "cause": [
            "Tất cả đơn hôm qua đã mất vĩnh viễn.",
            "Chưa đánh giá backup, log và nguồn khác."
          ]
        }
      },
      "check": {
        "prompt": "Mục nào cho biết dữ liệu đang dùng được backup lúc nào?",
        "explanation": "Created của backup khác thời gian job restore hoàn tất.",
        "options": {
          "direct": [
            "PANEL: restored backup",
            "Đọc mốc tạo đúng bản đã restore."
          ],
          "wrong1": [
            "PANEL: incident time",
            "Đây là mốc sự cố, không phải tuổi backup."
          ],
          "wrong2": [
            "PANEL: restore validation",
            "Kết quả boot/validation không cho thời gian tạo backup."
          ]
        }
      },
      "output": {
        "prompt": "Backup trước incident 60 giờ, binlog còn chưa kiểm định. Nên mô tả rủi ro ra sao?",
        "explanation": "Khoảng thời gian chỉ gợi phạm vi có thể thiếu; cần dữ liệu thực và log đã kiểm chứng.",
        "options": {
          "supported": [
            "Có thể thiếu đơn sau backup; cần so order và thử nguồn log.",
            "Chưa biến 60 giờ thành số đơn hoặc mất vĩnh viễn."
          ],
          "over": [
            "Mọi đơn trong 60 giờ đều mất vĩnh viễn.",
            "Chưa biết giao dịch phát sinh và khả năng replay."
          ],
          "ignore": [
            "Backup boot được nên không cần kiểm tra đơn.",
            "Boot không xác nhận nội dung DB đầy đủ."
          ]
        }
      },
      "evidence": {
        "prompt": "Chọn hai timestamp đã có để tính khoảng trống.",
        "explanation": "Hai mốc cùng UTC chưa trực tiếp cho số đơn mất.",
        "options": {
          "p1": [
            "Backup tạo 20/10 00:00 UTC.",
            "Mốc dữ liệu của bản được restore."
          ],
          "p2": [
            "Incident ở 22/10 12:00 UTC.",
            "So với backup được 60 giờ."
          ],
          "over": [
            "Không còn nguồn nào phục hồi đơn sau 20/10.",
            "Có inventory binlog cần kiểm định."
          ]
        }
      },
      "decision": {
        "prompt": "Nên thử phục hồi đơn thiếu thế nào để tránh mất thêm?",
        "explanation": "Bảo toàn hiện trạng và thử log riêng trước khi áp vào production.",
        "options": {
          "safe": [
            "Giữ bản hiện tại; thử phục hồi riêng.",
            "Kiểm tra liên tục, integrity và kết quả nghiệp vụ trước change."
          ],
          "unsafe": [
            "Restore lặp lại production hoặc nhập đơn thủ công ngay.",
            "Có thể ghi đè đơn mới, tạo trùng và mất khả năng đối chiếu."
          ],
          "close": [
            "Đóng ticket khi DB service active.",
            "DB chạy chưa xác minh các đơn khách cần."
          ]
        }
      },
      "order": {
        "prompt": "Sắp xếp đánh giá và phục hồi đơn thiếu.",
        "explanation": "Mốc và nguồn trước, thử phục hồi sau, đối chiếu nghiệp vụ cuối.",
        "options": {
          "evidence": [
            "So backup time, incident, order IDs và inventory binlog.",
            "Xác định nguồn và khoảng trống trước can thiệp."
          ],
          "verify": [
            "So order IDs, số liệu đối soát và mốc phục hồi đã thống nhất.",
            "Cần kiểm tra nghiệp vụ, không chỉ boot."
          ],
          "act": [
            "Đội DB/backup thử phục hồi riêng theo kế hoạch owner duyệt.",
            "Không thử ghi đè production trước khi biết kết quả."
          ]
        }
      }
    },
    "review": {
      "technical": "60 giờ không là số giao dịch mất; binlog pending chưa bảo đảm PITR; boot khác order integrity.",
      "editorial": "Câu hỏi xoay quanh timestamp và order thay nhãn RPO mơ hồ.",
      "references": [
        "https://dev.mysql.com/doc/refman/8.4/en/point-in-time-recovery.html"
      ],
      "fixtureChanges": []
    },
    "answerOverrides": {
      "expected_diagnosis": "Backup sớm hơn incident 60 giờ. Có thể thiếu đơn sau mốc backup, chưa biết số lượng; binlog còn cần kiểm định.",
      "recommended_next_checks": "So order IDs, backup time và chuỗi binlog; đánh giá log có liên tục và replay được tới đâu.",
      "resolution_guidance": "Giữ bản hiện tại, thử recovery riêng cùng DB/backup owner; thống nhất mốc và rủi ro trước áp dụng.",
      "verification": "Đối chiếu order, số liệu nghiệp vụ và consistency ở mốc đã chấp thuận.",
      "escalate_when": "Dữ liệu giao dịch quan trọng, cần DB recovery hoặc kết quả log chưa rõ.",
      "production_warning": "Không restore lặp lại production hoặc tự nhập đơn khi chưa đối soát."
    }
  },
  "VPS-11-007": {
    "objective": "Đối chiếu lỗi xác thực backup với rotation và key ID agent mà không lộ secret.",
    "customerExplanation": "Backup theo lịch lỗi sau lần đổi khóa. Cần kiểm tra khóa agent tham chiếu và quyền, không gửi secret qua ticket.",
    "hints": [
      "Lỗi xác thực khác quota hoặc lỗi đọc file.",
      "So key rejected với audit rotation và key ID agent dùng.",
      "Khóa mới backup-key-7 nhưng agent còn tham chiếu backup-key-6; owner cần cập nhật qua kênh secret rồi kiểm tra backup."
    ],
    "verificationPrompt": "Ghi lỗi xác thực, key ID cũ/mới và backup đã xác minh gần nhất. Không chép secret; nêu owner, rollback và cách kiểm tra bản mới.",
    "probes": {
      "P1": {
        "purpose": "Đọc log xác thực backup-agent.",
        "why": "Phân biệt lỗi credential với dung lượng hoặc dữ liệu.",
        "meaning": "Authentication failed: key rejected xác nhận khóa bị từ chối; chưa tự phân biệt khóa cũ và scope.",
        "output": "Oct 22 01:35:11 vm-117 backup-agent[2140]: Authentication failed: key rejected"
      },
      "P2": {
        "purpose": "Đọc sự kiện thay credential.",
        "why": "Khách liên hệ lỗi với rotation nên cần kiểm tra audit.",
        "meaning": "Có rotation gần đây; chưa nói agent đã dùng khóa nào."
      },
      "G1": {
        "purpose": "So key ID mới với agent reference.",
        "why": "Xác định lệch phiên bản mà không hiển thị secret.",
        "meaning": "Khóa mới backup-key-7 lúc 01:30 UTC, agent còn backup-key-6; cần owner xác nhận cách cập nhật và scope."
      },
      "G2": {
        "purpose": "Đọc mốc backup cuối đã thử restore.",
        "why": "Biết khả năng khôi phục hiện còn tới đâu khi bản mới lỗi.",
        "meaning": "Bản 21/10 đã thử restore; vẫn cần backup mới sau sửa credential."
      }
    },
    "questions": {
      "triage": {
        "prompt": "Khách liên hệ lỗi backup với thay đổi nào?",
        "explanation": "Trùng thời điểm là đầu mối, chưa tự chứng minh credential cụ thể sai.",
        "options": {
          "symptom": [
            "Backup lỗi sau lần xoay khóa.",
            "Cần so log với audit thay đổi gần nhất."
          ],
          "other": [
            "Backup chỉ lỗi khi target hết quota.",
            "Khách chưa báo quota; cần đọc log."
          ],
          "cause": [
            "Đã biết giá trị secret mới bị sai.",
            "Chưa xác nhận key ID agent dùng hoặc scope."
          ]
        }
      },
      "check": {
        "prompt": "Đọc đâu để biết agent bị từ chối ở bước nào?",
        "explanation": "Log agent cho lỗi cụ thể, audit rotation là nguồn đối chiếu.",
        "options": {
          "direct": [
            "journalctl -u backup-agent -n 30",
            "Đọc log đúng unit, cần quyền journal."
          ],
          "wrong1": [
            "PANEL: credentials",
            "Sự kiện rotation không thay thông báo lỗi agent."
          ],
          "wrong2": [
            "PANEL: last verified backup",
            "Mốc bản cũ tốt không giải thích lần mới thất bại."
          ]
        }
      },
      "output": {
        "prompt": "Agent bị key rejected và còn key-6 sau rotation sang key-7. Kết luận nào phù hợp?",
        "explanation": "Audit hỗ trợ lệch reference; chưa chứng minh tác vụ sau cập nhật sẽ thành công.",
        "options": {
          "supported": [
            "Reference của agent chưa khớp; cần owner xác minh khóa và scope.",
            "Có key ID lệch cụ thể để điều tra bằng metadata."
          ],
          "over": [
            "Cần dán private key mới vào ticket để sửa.",
            "Key ID đủ đối chiếu; đưa secret vào ticket gây lộ credential."
          ],
          "ignore": [
            "Key rejected không liên quan rotation nên cứ retry.",
            "Audit lệch reference là bằng chứng, retry không đổi credential."
          ]
        }
      },
      "evidence": {
        "prompt": "Chọn hai đầu mối đã có trước khi thay credential.",
        "explanation": "Log và rotation giúp điều tra, không cấp phép thu secret.",
        "options": {
          "p1": [
            "Agent ghi Authentication failed: key rejected.",
            "Đây là lỗi xác thực, không phải backup thành công."
          ],
          "p2": [
            "Credential được xoay gần đây.",
            "Cần so sự kiện với key reference agent."
          ],
          "over": [
            "Ticket cần chứa private key mới.",
            "Không cần secret để đối chiếu key ID."
          ]
        }
      },
      "decision": {
        "prompt": "Cập nhật credential theo cách nào?",
        "explanation": "Owner quản lý secret và scope; sau change cần tác vụ mới được kiểm chứng.",
        "options": {
          "safe": [
            "Dùng secret manager theo quy trình owner duyệt.",
            "Giữ secret ngoài ticket, đúng quyền và rollback."
          ],
          "unsafe": [
            "Gửi private key qua ticket hoặc tắt xác thực kho.",
            "Lộ secret hoặc bỏ kiểm soát truy cập backup."
          ],
          "close": [
            "Đóng ticket ngay khi lưu credential mới.",
            "Chưa thử backup và restore sau cập nhật."
          ]
        }
      },
      "order": {
        "prompt": "Sắp xếp xử lý backup sau key rotation.",
        "explanation": "Metadata trước, cập nhật qua đúng kênh sau, kiểm định bản mới cuối.",
        "options": {
          "evidence": [
            "So log, key ID, rotation audit và mốc backup đã xác minh.",
            "Xác định reference lệch mà không thu secret."
          ],
          "verify": [
            "Xác nhận backup mới hoàn tất và thử restore, không lộ secret.",
            "Kiểm tra kết quả sau change chứ không chỉ lưu cấu hình."
          ],
          "act": [
            "Owner cập nhật credential đúng scope qua kênh secret có audit.",
            "Đúng người thay sau khi xác định khóa."
          ]
        }
      }
    },
    "review": {
      "technical": "Không thu secret; key ID hỗ trợ mismatch; chuẩn hóa prefix journal giữ key-rejected event.",
      "editorial": "Câu và feedback phân biệt metadata, secret, kết quả backup.",
      "references": [
        "https://www.freedesktop.org/software/systemd/man/latest/journalctl.html"
      ],
      "fixtureChanges": [
        {
          "probeId": "P1",
          "reason": "Thêm prefix đúng dạng journal cho cùng event key rejected, timestamp nhất quán rotation audit.",
          "reference": "https://www.freedesktop.org/software/systemd/man/latest/journalctl.html"
        }
      ]
    },
    "answerOverrides": {
      "expected_diagnosis": "Backup-agent bị từ chối khóa; audit ghi rotation sang key-7 nhưng agent còn tham chiếu key-6.",
      "recommended_next_checks": "So key ID, scope, service account và rotation audit qua kênh được phép; giữ secret ngoài ticket.",
      "resolution_guidance": "Owner/backup team cập nhật reference hoặc credential qua secret manager theo runbook có rollback.",
      "verification": "Backup mới hoàn tất, không còn lỗi xác thực và thử restore được kiểm định.",
      "escalate_when": "Không có quyền quản lý secret, scope chưa rõ hoặc backup gián đoạn vượt mốc chấp nhận.",
      "production_warning": "Không gửi private key qua ticket hoặc tắt xác thực backup."
    }
  },
  "VPS-11-008": {
    "objective": "Nhận diện IP trùng giữa clone restore và production, rồi cách ly đúng clone để bảo vệ dịch vụ.",
    "customerExplanation": "VM vừa restore gây xung đột với VPS production. Cần xác định VM, IP và mạng trước can thiệp.",
    "hints": [
      "Clone có thể mang IP cũ; chưa thể nói production là máy cần tắt.",
      "So IP hai NIC, trạng thái clone và ARP theo timestamp.",
      "Hai VM cùng 198.51.100.20, clone đang chạy trên br-public và hai MAC phát cùng IP; nhờ ảo hóa cách ly đúng clone."
    ],
    "verificationPrompt": "Ghi VM/IP trùng, attachment clone và ARP. Nêu cách ly có quyền, mạng riêng cho restore test và phép xác minh production hết ảnh hưởng.",
    "probes": {
      "P1": {
        "purpose": "Đọc IP NIC của clone vừa restore.",
        "why": "Xác định clone mang địa chỉ nào trước so với production.",
        "meaning": "Clone được ghi 198.51.100.20; panel riêng chưa chứng minh nó đang phát gói."
      },
      "P2": {
        "purpose": "Đọc IP của VM production.",
        "why": "So địa chỉ clone với dịch vụ đang dùng thật.",
        "meaning": "Production cũng có 198.51.100.20; cần kiểm tra attachment và hoạt động mạng."
      },
      "G1": {
        "purpose": "Đọc mạng NIC clone và VM state.",
        "why": "Kiểm tra clone có hoạt động trên cùng mạng ảnh hưởng không.",
        "meaning": "Clone Running trên br-public; chưa cách ly cho restore test."
      },
      "G2": {
        "purpose": "Đọc sự kiện trùng IP theo MAC/thời gian.",
        "why": "Liên hệ cấp phát panel với ảnh hưởng mạng thực.",
        "meaning": "Hai MAC phát cùng 198.51.100.20 trong 10:20–10:25 UTC. Cần map MAC đúng VM trước cách ly."
      }
    },
    "questions": {
      "triage": {
        "prompt": "Phải phân biệt hai máy nào trước khi xử lý xung đột?",
        "explanation": "Giữ production phục vụ, nhận diện clone để tránh thao tác nhầm.",
        "options": {
          "symptom": [
            "VM restore gây xung đột với VPS production.",
            "Đúng phạm vi hai máy cần đối chiếu."
          ],
          "other": [
            "Chỉ archive backup bị lỗi checksum.",
            "Không đúng hiện tượng hai VM đang ảnh hưởng nhau."
          ],
          "cause": [
            "Đã biết production phải bị tắt.",
            "Chưa định vị máy gây xung đột hoặc quyền can thiệp."
          ]
        }
      },
      "check": {
        "prompt": "Đọc đâu để biết NIC clone đang được gán IP nào?",
        "explanation": "Nhận diện clone trước rồi mới đối chiếu production.",
        "options": {
          "direct": [
            "PANEL: restored VM NIC",
            "Đọc đúng NIC của VM restore."
          ],
          "wrong1": [
            "PANEL: live VM NIC",
            "Đây là địa chỉ production, không phải clone được hỏi."
          ],
          "wrong2": [
            "PANEL: ARP observations",
            "ARP ghi địa chỉ đang được phát trên mạng, không thay cấu hình IP gán cho NIC clone."
          ]
        }
      },
      "output": {
        "prompt": "Cùng IP, clone nối public bridge và ARP có hai MAC. Nên hiểu thế nào?",
        "explanation": "Bằng chứng hỗ trợ trùng IP trên mạng chung; cần nhắm đúngclone và giữ production.",
        "options": {
          "supported": [
            "Cần cách ly clone có quyền và đối chiếu kế hoạch IP trước test tiếp.",
            "Không coi clone boot được là restore an toàn cho mạng thật."
          ],
          "over": [
            "ĐổiDNSA là đủ hết duplicate IP của hai NIC.",
            "DNS không đổi IP mà NIC phát trên cùng mạng."
          ],
          "ignore": [
            "IP panel chỉ là metadata nên không cần đối chiếu ARP.",
            "ARP hai MAC là bằng chứng hoạt động cần map với VM."
          ]
        }
      },
      "evidence": {
        "prompt": "Chọn hai địa chỉ được panel ghi cho clone và production.",
        "explanation": "Cùng IP là đầu mối; cần trạng thái/NIC và ARP để xác định hoạt động.",
        "options": {
          "p1": [
            "NIC clone ghi 198.51.100.20.",
            "Đây là địa chỉ VM restore."
          ],
          "p2": [
            "NIC production cũng ghi 198.51.100.20.",
            "Hai bản ghi đang trùng địa chỉ."
          ],
          "over": [
            "Sửa DNS sẽ làm hai NIC tự dùng hai IP khác nhau.",
            "DNS không sửa cấp phát hoặc cấu hình NIC."
          ]
        }
      },
      "decision": {
        "prompt": "Hướng nào giảm xung đột mà tránh cắt nhầm production?",
        "explanation": "Cách ly đúng clone qua đội có quyền rồi dùng mạng test riêng.",
        "options": {
          "safe": [
            "Cách ly đúng NIC clone qua đội ảo hóa.",
            "Giữ production và ranh giới restore test."
          ],
          "unsafe": [
            "Tắt production để clone dùng IP cũ.",
            "Làm gián đoạn dịch vụ thật và chưa sửa kế hoạch clone."
          ],
          "close": [
            "Đóng ticket vì clone đã boot.",
            "Boot không xác minh xung đột hoặc dịch vụ khách."
          ]
        }
      },
      "order": {
        "prompt": "Sắp xếp xử lý xung đột clone–production.",
        "explanation": "Xác định đúng máy trước, cách ly clone sau, xác minh ảnh hưởng cuối.",
        "options": {
          "evidence": [
            "Map VM/MAC, so hai IP, attachment và ARP theo thời điểm.",
            "Tránh cách ly nhầm hoặc chỉ dựa nhãn panel."
          ],
          "verify": [
            "Kiểm tra hết ARP conflict, production truy cập được và clone ở mạng test.",
            "Cần kiểm chứng cả triệu chứng khách và phạm vi mạng."
          ],
          "act": [
            "Đội có quyền cách ly NIC clone và áp IP test được duyệt.",
            "Thay mạng có mục tiêu sau xác định clone."
          ]
        }
      }
    },
    "review": {
      "technical": "Cùng IP panel chưa đủ nếu không network-active; giữ ARP/attachment và không tắt production.",
      "editorial": "Đặt lựa chọn quanh clone/production thay generic close.",
      "references": [],
      "fixtureChanges": []
    },
    "answerOverrides": {
      "expected_diagnosis": "Clone và production cùng 198.51.100.20; clone Running trên public bridge, có sự kiện hai MAC phát cùng IP.",
      "recommended_next_checks": "Map VM/MAC, attachment, owner và kế hoạch mạng restore; xác minh ảnh hưởng theo thời điểm.",
      "resolution_guidance": "Đội ảo hóa cách ly đúng NIC clone; owner duyệt IP/mạng test riêng trước nối lại.",
      "verification": "Hết conflict, production truy cập được và clone chỉ hoạt động trong mạng test đã thống nhất.",
      "escalate_when": "Cần đội network/virtualization thao tác host hoặc production đang bị ảnh hưởng.",
      "production_warning": "Không tắt production để nhường IP cho clone hoặc đổi DNS để che xung đột."
    }
  },
  "VPS-11-002": {
    "objective": "So mốc khách muốn khôi phục với các bản backup thực sự có trước khi đề xuất restore.",
    "customerExplanation": "Khách muốn quay VPS về sáng nay. Cần xác nhận giờ, múi giờ và bản backup có sẵn.",
    "hints": [
      "“Sáng nay” cần một mốc giờ có múi giờ.",
      "So restore points đã hoàn tất với requested time.",
      "Bản ngày 20/10 sớm hơn yêu cầu ngày 22/10. Tìm nguồn khác và giải thích dữ liệu có thể thiếu trước khi chọn mốc."
    ],
    "verificationPrompt": "Ghi mốc yêu cầu, backup có sẵn và nguồn khác đã tìm. Nêu dữ liệu có thể thiếu, lựa chọn cần owner đồng ý và cách thử restore riêng.",
    "probes": {
      "P1": {
        "purpose": "Đọc các điểm khôi phục đã hoàn tất.",
        "why": "Cần biết thực sự có bản nào đáp ứng yêu cầu theo giờ.",
        "meaning": "Bản hoàn tất mới nhất là 20/10 00:00 UTC; chưa có mốc sáng 22/10 trong danh sách."
      },
      "P2": {
        "purpose": "Đọc thời điểm khách yêu cầu khôi phục.",
        "why": "Phải so cùng ngày, giờ và múi giờ với backup.",
        "meaning": "Yêu cầu là 22/10 08:00 UTC, sau backup 56 giờ. Chưa có điểm khôi phục được xác nhận cho khoảng này."
      },
      "G1": {
        "purpose": "Tìm snapshot trong khoảng đang thiếu.",
        "why": "Cần tìm nguồn khác trước khi cam kết hoặc từ chối phục hồi.",
        "meaning": "Kho snapshot này không có bản trong khoảng hỏi; chưa loại trừ backup ngoài hệ thống hoặc log ứng dụng."
      }
    },
    "questions": {
      "triage": {
        "prompt": "Khách đang yêu cầu khôi phục tới mốc nào?",
        "explanation": "Đây là yêu cầu theo thời điểm; cần làm rõ giờ và múi giờ trước chọn backup.",
        "options": {
          "symptom": [
            "Quay VPS về thời điểm sáng nay.",
            "Khách chưa đồng ý dùng một bản cũ hơn."
          ],
          "other": [
            "Tạo thêm backup của VPS hiện tại.",
            "Khách hỏi restore, không chỉ tạo bản mới."
          ],
          "cause": [
            "Đã có backup đúng sáng nay để dùng.",
            "Yêu cầu không xác nhận lịch backup hay bản đã hoàn tất."
          ]
        }
      },
      "check": {
        "prompt": "Mục nào cho biết có thể chọn những bản backup nào?",
        "explanation": "Restore points xác định mốc có sẵn; thời điểm mong muốn không tự tạo ra backup.",
        "options": {
          "direct": [
            "PANEL: restore points",
            "Danh sách này ghi các điểm khôi phục đã có."
          ],
          "wrong1": [
            "PANEL: requested time",
            "Đây là mục tiêu khách muốn, không phải inventory backup."
          ],
          "wrong2": [
            "PANEL: backup task",
            "Một task không thay thế danh sách các bản đã hoàn tất."
          ]
        }
      },
      "output": {
        "prompt": "Bản mới nhất là 20/10 00:00 UTC, khách muốn 22/10 08:00 UTC. Có thể cam kết gì?",
        "explanation": "Backup cũ không tự chứa thay đổi xảy ra sau khi nó được tạo.",
        "options": {
          "supported": [
            "Chưa có bản đúng mốc yêu cầu; cần tìm nguồn khác trước cam kết.",
            "Hai mốc cách 56 giờ, nên restore bản cũ có thể thiếu thay đổi mới."
          ],
          "over": [
            "Restore bản 20/10 sẽ trả đúng dữ liệu 22/10 08:00.",
            "Chưa có nguồn chứa các thay đổi sau mốc backup."
          ],
          "ignore": [
            "Cứ dùng bản mới nhất, không cần so với giờ khách muốn.",
            "Mới nhất trong kho vẫn có thể sớm hơn mốc yêu cầu."
          ]
        }
      },
      "evidence": {
        "prompt": "Chọn hai mốc thời gian được panel ghi rõ.",
        "explanation": "Hai timestamp chưa tự xác nhận dữ liệu giữa chúng có thể khôi phục.",
        "options": {
          "p1": [
            "Backup hoàn tất mới nhất: 20/10 00:00 UTC.",
            "Mốc này nằm trong restore points."
          ],
          "p2": [
            "Requested time: 22/10 08:00 UTC.",
            "Đây là mục tiêu phải đối chiếu khi tìm nguồn."
          ],
          "over": [
            "Bản 20/10 chứa toàn bộ thay đổi đến sáng 22/10.",
            "Không có dữ liệu bổ sung chứng minh điều này."
          ]
        }
      },
      "decision": {
        "prompt": "Cần làm gì trước khi dùng bản sớm hơn yêu cầu 56 giờ?",
        "explanation": "Owner phải biết mốc và rủi ro trước mọi thao tác ghi dữ liệu.",
        "options": {
          "safe": [
            "Trình bày khoảng trống, nhờ owner chọn mốc.",
            "Không hứa mốc chưa có hoặc ghi đè khi chưa đồng ý."
          ],
          "unsafe": [
            "Restore ngay bản 20/10 lên production để khách thử.",
            "Có thể ghi đè dữ liệu mới mà khách chưa chấp thuận."
          ],
          "close": [
            "Đóng yêu cầu vì panel có ít nhất một restore point.",
            "Có bản backup chưa đồng nghĩa đáp ứng đúng thời điểm."
          ]
        }
      }
    },
    "review": {
      "technical": "Tính 56 giờ; catalog không đủ cam kết PITR; tìm nguồn khác trước kết luận mất dữ liệu.",
      "editorial": "Tách restore với backup mới; câu hỏi dùng hai mốc thực.",
      "references": [],
      "fixtureChanges": []
    },
    "answerOverrides": {
      "expected_diagnosis": "Chưa có restore point đúng 22/10 08:00 UTC; bản 20/10 00:00 UTC sớm hơn 56 giờ.",
      "recommended_next_checks": "Tìm backup ngoài hệ thống, snapshot và log ứng dụng; xác nhận múi giờ và mốc cần khôi phục.",
      "resolution_guidance": "Giải thích lựa chọn khả thi; owner chọn mốc sau khi hiểu dữ liệu có thể thiếu. Thử restore riêng trước production.",
      "verification": "Đối chiếu dữ liệu và mốc đã thống nhất; chỉ restore production sau approval.",
      "escalate_when": "Cần backup team hoặc phục hồi dữ liệu nghiệp vụ quan trọng vượt nguồn hiện có.",
      "production_warning": "Không ghi đè production bằng bản cũ chỉ để khách thử."
    }
  },
  "VPS-11-003": {
    "objective": "Đọc lỗi tar và đối chiếu checksum, bảo toàn archive trước khi chọn nguồn phục hồi khác.",
    "customerExplanation": "Có file backup nhưng công cụ đọc archive báo lỗi. File tồn tại không bảo đảm dữ liệu bên trong dùng được.",
    "hints": [
      "Tên file và kích thước không chứng minh archive đọc được.",
      "tar -tf đọc danh sách; so sha256sum với checksum từ nguồn tin cậy.",
      "Unexpected EOF nghĩa là không đọc trọn. Giữ bản lỗi và kiểm tra bản khác, không thử ghi đè production."
    ],
    "verificationPrompt": "Ghi lỗi tar, hash hiện tại và checksum chuẩn nếu đã xem. Nêu cách giữ bản gốc, tìm bản thay thế và thử giải nén riêng.",
    "probes": {
      "P1": {
        "purpose": "Đọc danh sách mục trong archive mà không giải nén.",
        "why": "Cần kiểm tra cấu trúc backup trước khi dùng để restore.",
        "meaning": "tar báo Unexpected EOF rồi thoát lỗi trên stderr: chưa đọc trọn archive. Lệnh không sửa file hoặc bảo đảm toàn bộ dữ liệu file con."
      },
      "P2": {
        "purpose": "Tính SHA-256 của archive hiện có.",
        "why": "Cần so bản đang đọc với checksum lưu từ bản nguồn.",
        "meaning": "Hash bắt đầu a7849b8b. Một hash tự nó không nói file tốt hay hỏng; cần giá trị chuẩn tin cậy."
      },
      "G1": {
        "purpose": "Đọc checksum lưu cùng backup nguồn.",
        "why": "Phân biệt bản đang có với bản nguồn đã được ghi nhận.",
        "meaning": "Hash chuẩn bắt đầu 19b597ac, khác bản hiện tại. Chưa biết thay đổi xảy ra ở kho, transport hay bản copy."
      }
    },
    "questions": {
      "triage": {
        "prompt": "Khách đang mô tả tình trạng nào của backup?",
        "explanation": "Cần điều tra khả năng đọc file, chưa biết dữ liệu nào phục hồi được.",
        "options": {
          "symptom": [
            "File có tồn tại nhưng đọc hoặc giải nén báo lỗi.",
            "Đây là điều cần kiểm tra bằng công cụ archive."
          ],
          "other": [
            "Không tìm thấy bất kỳ file backup nào.",
            "Khách có file và gặp lỗi khi dùng, khác thiếu file."
          ],
          "cause": [
            "Đã biết archive hỏng ngay tại kho nguồn.",
            "Còn phải so bản nguồn và đường copy để định vị."
          ]
        }
      },
      "check": {
        "prompt": "Lệnh nào thử đọc danh sách app.tar mà chưa ghi file khôi phục?",
        "explanation": "tar -t liệt kê; không giải nén đè dữ liệu.",
        "options": {
          "direct": [
            "tar -tf /backup/app.tar",
            "-t đọc danh sách, -f chọn archive cần đọc."
          ],
          "wrong1": [
            "sha256sum /backup/app.tar",
            "Tính hash nhưng không thử đọc cấu trúc tar."
          ],
          "wrong2": [
            "ls -lh /backup/app.tar",
            "Tên và kích thước không chứng minh archive đọc trọn."
          ]
        }
      },
      "output": {
        "prompt": "tar báo Unexpected EOF và đã tính hash. Có nên restore production từ bản này?",
        "explanation": "Lỗi đọc đủ để dừng restore mù; hash còn cần đối chiếu chuẩn.",
        "options": {
          "supported": [
            "Chưa đủ tin để restore; tar không đọc trọn và cần so checksum.",
            "Nếu đã xem checksum chuẩn, ghi rõ khác biệt; không ghi đè production để thử."
          ],
          "over": [
            "Đổi đuôi file hoặc chạy tar lại sẽ sửa phần bị thiếu.",
            "Đổi tên và đọc lại không tái tạo dữ liệu thiếu."
          ],
          "ignore": [
            "Có SHA-256 nên có thể bỏ qua EOF.",
            "Mọi file đều tính được hash; chưa so chuẩn thì chưa kiểm định."
          ]
        }
      },
      "evidence": {
        "prompt": "Chọn hai kết quả trực tiếp của các lệnh đọc archive.",
        "explanation": "Hash mismatch cần thêm giá trị chuẩn; không suy chỉ từ hash hiện tại.",
        "options": {
          "p1": [
            "tar dừng với Unexpected EOF in archive.",
            "Công cụ chưa đọc trọn archive."
          ],
          "p2": [
            "sha256sum đã in hash của file hiện tại.",
            "Đây là giá trị cần đối chiếu nguồn chuẩn."
          ],
          "over": [
            "Đổi extension đã phục hồi nội dung archive.",
            "Không có kết quả nào xác nhận dữ liệu được sửa."
          ]
        }
      },
      "decision": {
        "prompt": "Làm gì với archive đang đọc lỗi trước khi tìm bản thay thế?",
        "explanation": "Giữ bản lỗi để điều tra và kiểm định bản thay thế ở khu vực riêng.",
        "options": {
          "safe": [
            "Giữ archive lỗi; tìm bản backup khác.",
            "Bảo toàn chứng cứ và nguồn có thể còn phục hồi một phần."
          ],
          "unsafe": [
            "Xóa bản lỗi hoặc restore đè production để thử.",
            "Có thể mất chứng cứ hoặc phá trạng thái còn tốt."
          ],
          "close": [
            "Đóng ticket khi tải lại được file cùng tên.",
            "Cùng tên không chứng minh đúng checksum hoặc restore được."
          ]
        }
      }
    },
    "review": {
      "technical": "Một hash không là kiểm tra toàn vẹn đạt; output question không đòi kết luận baseline khi G1 chưa bắt buộc; tar -t không bảo đảm file data integrity.",
      "editorial": "Phân biệt file tồn tại, đọc được cấu trúc và so checksum.",
      "references": [
        "https://www.gnu.org/software/tar/manual/html_node/Data-corruption-and-repair.html"
      ],
      "fixtureChanges": []
    },
    "answerOverrides": {
      "expected_diagnosis": "tar không đọc trọn archive; hash tính được cần so chuẩn. Khi đối chiếu checksum lưu, hai bản có hash khác nhau.",
      "recommended_next_checks": "So nguồn copy, checksum chuẩn và log storage; tìm backup khác đã được kiểm định.",
      "resolution_guidance": "Giữ bản lỗi, không ghi đè; nhờ backup team đánh giá và thử bản thay thế trong khu vực riêng.",
      "verification": "Đọc/giải nén bản thay thế thành công, so checksum và dữ liệu ứng dụng.",
      "escalate_when": "Nhiều backup cùng lỗi, không có bản tin cậy hoặc cần điều tra storage/transport.",
      "production_warning": "Tính hash không sửa file; không xóa nguồn cuối hoặc thử restore đè dữ liệu thật."
    }
  },
  "VPS-11-004": {
    "objective": "Phân biệt dung lượng datastore của host với đĩa guest khi tạo snapshot thất bại.",
    "customerExplanation": "Khách không tạo được VM snapshot. Cần xem lỗi tác vụ và kho snapshot trước khi đề xuất dọn dữ liệu.",
    "hints": [
      "Đĩa guest còn chỗ không bảo đảm datastore của host còn chỗ.",
      "So no space left on datastore với mức dùng của đúng kho.",
      "Kho có active snapshot chains và cleanup chưa duyệt; nhờ storage đánh giá trước xóa."
    ],
    "verificationPrompt": "Ghi lỗi snapshot và mức dùng datastore, tách khỏi guest disk. Nêu đội xử lý, điều kiện cleanup/mở rộng và cách kiểm tra snapshot mới.",
    "probes": {
      "P1": {
        "purpose": "Đọc lỗi tác vụ snapshot.",
        "why": "Xác định thao tác thất bại ở lớp host hay guest.",
        "meaning": "Lỗi no space left on datastore chỉ tới kho host; chưa chứng minh guest filesystem đầy."
      },
      "P2": {
        "purpose": "Đọc mức dùng datastore.",
        "why": "Đối chiếu lỗi với headroom của kho snapshot.",
        "meaning": "99,9% đã dùng cho thấy gần hết chỗ. Cần xem quota, snapshot chain và sức khỏe kho."
      },
      "G1": {
        "purpose": "Đọc active snapshot chains và trạng thái cleanup.",
        "why": "Không thể chọn snapshot để xóa chỉ bằng tuổi hoặc kích thước.",
        "meaning": "ds-3 có 12 chain đang hoạt động, cleanup pending. Xóa tùy ý có thể ảnh hưởng VM khác."
      }
    },
    "questions": {
      "triage": {
        "prompt": "Thao tác nào đang thất bại trong yêu cầu này?",
        "explanation": "Tạo snapshot ở host khác giải nén file backup trong guest.",
        "options": {
          "symptom": [
            "Tạo VM snapshot thất bại.",
            "Đúng tác vụ cần mở để đọc lỗi."
          ],
          "other": [
            "Giải nén archive trong guest thất bại.",
            "Khách không nêu thao tác này."
          ],
          "cause": [
            "Đã biết đĩa guest đầy từ lời khách.",
            "Chưa đọc số liệu; snapshot có thể lỗi ở kho host."
          ]
        }
      },
      "check": {
        "prompt": "Đọc đâu để tìm lỗi của lần tạo snapshot này?",
        "explanation": "Task cụ thể giúp chọn đúng lớp storage trước dọn dẹp.",
        "options": {
          "direct": [
            "PANEL: snapshot task",
            "Ghi kết quả và lỗi của chính lần snapshot."
          ],
          "wrong1": [
            "df -h /",
            "Đo filesystem guest, không đọc lỗi task snapshot host."
          ],
          "wrong2": [
            "PANEL: restore points",
            "Liệt kê các bản cũ, không giải thích task vừa lỗi."
          ]
        }
      },
      "output": {
        "prompt": "Task báo datastore hết chỗ và kho dùng 99,9%. Điều gì được xác nhận?",
        "explanation": "Hai nguồn cùng chỉ tới kho host; chưa cấp quyền xóa snapshot.",
        "options": {
          "supported": [
            "Datastore gần đầy, phù hợp lỗi snapshot; guest disk chưa được đo.",
            "Không trộn dung lượng host với guest khi xử lý."
          ],
          "over": [
            "Có thể xóa snapshot VM khác để lấy chỗ.",
            "Chưa biết chain, retention hoặc quyền của VM khác."
          ],
          "ignore": [
            "Mức dùng datastore không liên quan vì snapshot chỉ dùng guest disk.",
            "Task nêu rõ datastore và kho đang gần đầy."
          ]
        }
      },
      "evidence": {
        "prompt": "Chọn hai thông tin có trong task và datastore.",
        "explanation": "Lỗi và mức dùng không tự cho biết bản nào được phép xóa.",
        "options": {
          "p1": [
            "Task báo no space left on datastore.",
            "Lỗi chỉ rõ kho lưu snapshot."
          ],
          "p2": [
            "Datastore đang dùng 99,9%.",
            "Mức dùng phù hợp thiếu headroom."
          ],
          "over": [
            "Mọi snapshot cũ đều được phép xóa.",
            "Chưa có kiểm tra chain hoặc phê duyệt."
          ]
        }
      },
      "decision": {
        "prompt": "Có active snapshot chains khi datastore gần đầy. Nên làm gì?",
        "explanation": "Storage phải đánh giá chain và retention trước cleanup hoặc mở rộng.",
        "options": {
          "safe": [
            "Chuyển storage đánh giá chain.",
            "Đúng quyền trên kho dùng chung, bảo vệ các VM liên quan."
          ],
          "unsafe": [
            "Xóa snapshot lớn nhất để lấy chỗ nhanh.",
            "Kích thước không nói snapshot còn bị chain phụ thuộc hay không."
          ],
          "close": [
            "Đóng ticket khi đã bấm retry snapshot.",
            "Retry không thêm dung lượng hoặc xác nhận bản mới thành công."
          ]
        }
      }
    },
    "review": {
      "technical": "Kho host khác guest; active chains cần operator đánh giá.",
      "editorial": "Prompt dùng task và số 99,9%, feedback phân biệt các lớp storage.",
      "references": [
        "https://libvirt.org/formatsnapshot.html"
      ],
      "fixtureChanges": []
    },
    "answerOverrides": {
      "expected_diagnosis": "Snapshot thất bại vì datastore báo thiếu chỗ và dùng 99,9%; chưa xác nhận guest disk đầy.",
      "recommended_next_checks": "Kiểm tra capacity, sức khỏe kho, chain và retention; xác định owner của snapshot liên quan.",
      "resolution_guidance": "Chuyển storage/capacity đánh giá mở rộng hoặc cleanup được duyệt, không xóa chain tùy ý.",
      "verification": "Snapshot mới thành công, kho có headroom và các VM liên quan vẫn hoạt động.",
      "escalate_when": "Cần thao tác datastore dùng chung hoặc snapshot chain ngoài quyền support.",
      "production_warning": "Không xóa snapshot của VM khác hoặc format kho để lấy chỗ."
    }
  }
}
