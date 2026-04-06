package com.mbsystem.MBSystem.repository.leave;

import com.mbsystem.MBSystem.domain.Leave;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import static com.mbsystem.MBSystem.domain.QLeave.leave;

@Repository
public class LeaveRepository {

  @Autowired
  private SDJpaLeaveRepository leaveRepository;
  private EntityManager em;
  private JPAQueryFactory queryFactory;

  public LeaveRepository(EntityManager em) {
    this.em=em;
    this.queryFactory = new JPAQueryFactory(em);
  }

  public Leave save(Leave leave) {
    return leaveRepository.save(leave);
  }

  public List<Leave> findById(Long moduleId){
    return queryFactory.selectFrom(leave)
        .where(leave.module.id.eq(moduleId))
        .fetch();
  }

  public void delete(Long moduleId){
    queryFactory.delete(leave)
        .where(leave.module.id.eq(moduleId))
        .execute();
  }

}
