## Mark Class Diagram

```mermaid
classDiagram
    direction LR

    class MarkController {
        <<Controller>>
        -markService: MarkService
        +MarkController(markService: MarkService)
        +addMark(userDetails: CustomUserDetails, markedUserId: Long): ResponseEntity~MarkResponseDTO~
        +getMarkedUsers(userDetails: CustomUserDetails): ResponseEntity~List~MarkedUserResponseDTO~~
        +deleteMark(userDetails: CustomUserDetails, markedUserId: Long): ResponseEntity~Void~
    }

    class MarkService {
        <<Service>>
        -markRepository: MarkRepository
        -userRepository: UserRepository
        +MarkService(markRepository: MarkRepository, userRepository: UserRepository)
        +addMark(markingUserId: Long, markedUserId: Long): MarkResponseDTO
        +getMarkedUsers(markingUserId: Long): List~MarkedUserResponseDTO~
        +deleteMark(markingUserId: Long, markedUserId: Long): void
    }

    class MarkRepository {
        <<Repository>>
        -markRepository: SDJpaMarkRepository
        -em: EntityManager
        -queryFactory: JPAQueryFactory
        +MarkRepository(em: EntityManager)
        +saveMark(mark: Mark): void
        +findMarkByUsersId(usersId: Long): List~Mark~
        +findByUsersIdAndMarkedUsersId(usersId: Long, markedUsersId: Long): Mark
        +deleteMark(mark: Mark): void
    }

    class Mark {
        <<Entity>>
        -id: Long
        -users: User
        -markedUsersId: Long
    }

    class MarkedUserResponseDTO {
        <<DTO>>
        -markedUserId: Long
        -markedUserName: String
        -markedUserProfileImageUrl: String
        +fromEntity(markedUser: User): MarkedUserResponseDTO
    }

    class MarkResponseDTO {
        <<DTO>>
        -markId: Long
        -markingUserId: Long
        -markedUserId: Long
        +fromEntity(mark: Mark): MarkResponseDTO
    }

    class User { <<Entity>> }
    class UserRepository { <<Repository>> }
    class SDJpaMarkRepository { <<interface>> }
    class JpaRepository { <<interface>> }
    

    MarkController ..> MarkService : uses
    MarkService ..> MarkRepository : uses
    MarkService ..> UserRepository : uses
    MarkRepository ..> SDJpaMarkRepository : uses
    SDJpaMarkRepository --|> JpaRepository : extends
    User "1" <-- "*" Mark : users
    MarkController ..> MarkResponseDTO : uses
    MarkController ..> MarkedUserResponseDTO : uses
    MarkService ..> MarkResponseDTO : uses
    MarkService ..> MarkedUserResponseDTO : uses
    MarkRepository ..> Mark : manages
```

<br>

## MarkController 클래스 정보

| 구분             | Name               | Type                                        | Visibility | Description                                                           |
|:---------------|:-------------------|:--------------------------------------------|:-----------|:----------------------------------------------------------------------|
| **class**      | **MarkController** |                                             |            | 즐겨찾기 관련 HTTP 요청을 처리하는 REST 컨트롤러                                |
| **Attributes** | markService        | MarkService                                 | private    | 즐겨찾기 비즈니스 로직을 처리하는 서비스 객체                                   |
| **Operations** | MarkController     | void                                        | public     | 생성자 (Lombok @RequiredArgsConstructor)                              |
|                | addMark            | ResponseEntity~MarkResponseDTO~             | public     | 특정 사용자를 즐겨찾기에 추가하는 API (`POST /{markedUserId}`)          |
|                | getMarkedUsers     | ResponseEntity~List~MarkedUserResponseDTO~~ | public     | 현재 로그인된 사용자가 즐겨찾기한 모든 사용자 목록을 조회하는 API (`GET`)   |
|                | deleteMark         | ResponseEntity~Void~                        | public     | 특정 사용자를 즐겨찾기에서 삭제하는 API (`DELETE /{markedUserId}`)      |

<br>

## MarkService 클래스 정보

| 구분             | Name            | Type                        | Visibility | Description                                                |
|:---------------|:----------------|:----------------------------|:-----------|:-----------------------------------------------------------|
| **class**      | **MarkService** |                             |            | 즐겨찾기 관련 비즈니스 로직을 처리하는 서비스 객체                          |
| **Attributes** | markRepository  | MarkRepository              | private    | 즐겨찾기 정보(Mark)에 대한 데이터베이스 연산을 담당하는 리포지토리         |
|                | userRepository  | UserRepository              | private    | 사용자 정보(User)에 대한 데이터베이스 연산을 담당하는 리포지토리            |
| **Operations** | MarkService     | void                        | public     | 생성자 (Lombok @RequiredArgsConstructor)                 |
|                | addMark         | MarkResponseDTO             | public     | 특정 사용자를 즐겨찾기에 추가하는 비즈니스 로직                          |
|                | getMarkedUsers  | List~MarkedUserResponseDTO~ | public     | 특정 사용자가 즐겨찾기한 모든 사용자의 정보를 조회하는 비즈니스 로직         |
|                | deleteMark      | void                        | public     | 특정 사용자를 즐겨찾기 목록에서 삭제하는 비즈니스 로직                     |

<br>

## MarkRepository 클래스 정보

| 구분             | Name                          | Type                | Visibility | Description                                   |
|:---------------|:------------------------------|:--------------------|:-----------|:----------------------------------------------|
| **class**      | **MarkRepository**            |                     |            | DB에 저장된 즐겨찾기 정보를 관리하기 위한 클래스                 |
| **Attributes** | markRepository                | SDJpaMarkRepository | private    | Spring Data JPA 기능을 사용하기 위함            |
|                | em                            | EntityManager       | private    | 엔티티 객체를 관리해주는 객체                      |
|                | queryFactory                  | JPAQueryFactory     | private    | Query DSL 기능을 사용하기 위한 객체                      |
| **Operations** | MarkRepository                | void                | public     | 생성자                                        |
|                | saveMark                      | void                | public     | 즐겨찾기 정보를 DB에 저장하는 함수                          |
|                | findMarkByUsersId             | List~Mark~          | public     | 사용자 ID로 해당 유저의 모든 즐겨찾기 정보를 조회하는 함수     |
|                | findByUsersIdAndMarkedUsersId | Mark                | public     | 특정 사용자가 특정 사용자를 즐겨찾기 했는지 확인하는 함수 |
|                | deleteMark                    | void                | public     | 즐겨찾기 정보를 DB에서 삭제하는 함수                         |

<br>

## Mark 클래스 정보

| 구분             | Name          | Type | Visibility | Description                                      |
|:---------------|:--------------|:-----|:-----------|:-------------------------------------------------|
| **class**      | **Mark**      |      |            | 데이터베이스의 `marks` 테이블과 매핑되는 JPA 엔티티       |
| **Attributes** | id            | Long | private    | 즐겨찾기의 고유 ID (PK)                              |
|                | users         | User | private    | 즐겨찾기를 등록한 사용자 (FK)                        |
|                | markedUsersId | Long | private    | 즐겨찾기 대상이 된 사용자의 ID                       |

<br>

## MarkedUserResponseDTO 클래스 정보

| 구분             | Name                      | Type                  | Visibility | Description                                      |
|:---------------|:--------------------------|:----------------------|:-----------|:-------------------------------------------------|
| **class**      | **MarkedUserResponseDTO** |                       |            | 즐겨찾기된 사용자 정보 응답 DTO                          |
| **Attributes** | markedUserId              | Long                  | private    | 즐겨찾기된 사용자의 고유 ID                            |
|                | markedUserName            | String                | private    | 즐겨찾기된 사용자의 이름                               |
|                | markedUserProfileImageUrl | String                | private    | 즐겨찾기된 사용자의 프로필 이미지 URL                    |
| **Operations** | fromEntity                | MarkedUserResponseDTO | public     | User 엔티티를 DTO로 변환하는 정적 팩토리 메서드       |

<br>

## MarkResponseDTO 클래스 정보

| 구분             | Name                | Type            | Visibility | Description                                |
|:---------------|:--------------------|:----------------|:-----------|:-------------------------------------------|
| **class**      | **MarkResponseDTO** |                 |            | 즐겨찾기 생성/삭제 시 결과 응답 DTO                  |
| **Attributes** | markId              | Long            | private    | 생성된 즐겨찾기의 고유 ID                            |
|                | markingUserId       | Long            | private    | 즐겨찾기를 한 사용자의 ID                            |
|                | markedUserId        | Long            | private    | 즐겨찾기된 사용자의 ID                              |
| **Operations** | fromEntity          | MarkResponseDTO | public     | Mark 엔티티를 DTO로 변환하는 정적 팩토리 메서드 |
